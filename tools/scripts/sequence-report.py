import csv
import datetime
import io
import subprocess
import time

import boto3
import msgspec
from botocore.config import Config

if __name__ == "__main__":
    logs = boto3.client("logs", config=Config(region_name="ap-southeast-2"))

    to = datetime.datetime.now()
    from_ = to - datetime.timedelta(days=7)

    query = logs.start_query(
        logGroupName="/aws/lambda/app",
        startTime=int(from_.timestamp()),
        endTime=int(to.timestamp()),
        queryString="""
            fields @timestamp, @message, @logStream, @log
            | filter result.functionId="src_server_optimize_ts--optimizeSequence_createServerFn_handler"
            | sort @timestamp desc
            | limit 10000
    """,
    )

    while result := logs.get_query_results(queryId=query["queryId"]):
        if result["status"] in ["Scheduled", "Running"]:
            time.sleep(1)
        else:
            break

    if result["status"] != "Complete":
        raise RuntimeError(f"Could not complete query: {result}")

    full_sequences: list[dict] = sorted(
        [
            {
                "_time": datetime.datetime.fromisoformat(
                    next(it["value"] for it in log if it["field"] == "@timestamp")
                ),
                **msgspec.json.decode(
                    next(it["value"] for it in log if it["field"] == "@message")
                ),
            }
            for log in result["results"]
        ],
        # Sorted by IP address, then by time
        key=lambda x: f"{x['requestIp']}-{x['_time']}",
    )
    print(f"Full sequences: {len(full_sequences)}")

    # Remove sequences that have been submitted together
    # i.e. the same input sequence, from the same IP address, and submitted within 10 seconds of each other
    sequences = []
    for seq in full_sequences:
        last = sequences[-1] if sequences else None
        if (
            last
            and last["requestData"]["sequence"] == seq["requestData"]["sequence"]
            and last["requestIp"] == seq["requestIp"]
            and (seq["_time"] - last["_time"]).total_seconds() < 10
        ):
            continue
        sequences.append(seq)

    print(f"Distinct optimization requests: {len(sequences)}")

    ip_addresses = set(it["requestIp"] for it in full_sequences)
    print(f"Unique IP addresses: {len(ip_addresses)}")

    # Perform blast query
    unique_sequences = list(set([it["requestData"]["sequence"] for it in sequences]))
    print(f"Unique sequences: {len(unique_sequences)}")
    blast_query = "\n".join(
        f">{index}\n{seq}" for index, seq in enumerate(unique_sequences)
    )
    columns = [
        "qseqid",
        "sseqid",
        "sacc",
        "pident",
        "length",
        "mismatch",
        "gapopen",
        "qstart",
        "qend",
        "sstart",
        "send",
        "evalue",
        "bitscore",
        "score",
        "scomnames",
        "sscinames",
        "stitle",
    ]
    result = subprocess.run(
        [
            "blastn",
            "-remote",
            "-db",
            "core_nt",
            "-max_target_seqs",
            "1",
            "-outfmt",
            " ".join(["6"] + columns),
        ],
        input=blast_query.encode(),
        stdout=subprocess.PIPE,
    )

    if result.returncode != 0:
        raise RuntimeError(f"Error fetching BLAST+ report: {result}")

    reader = csv.DictReader(
        io.StringIO(result.stdout.decode()).readlines(),
        fieldnames=columns,
        delimiter="\t",
    )

import { Box, Tabs } from "@mantine/core";
import { DnaIcon, FileIcon, QuestionIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { Help } from "./Help";
import { Input } from "./Input";
import { Output } from "./Output";
import { OptimizationOutput } from "./types";

export const OptimizePage = () => {
  const [activeTab, setActiveTab] = useState<string | null>("input");
  return (
    <Tabs value={activeTab} onChange={setActiveTab}>
      <Tabs.List>
        <Tabs.Tab value="input" leftSection={<DnaIcon size={12} />}>
          Input
        </Tabs.Tab>
        <Tabs.Tab value="output" leftSection={<FileIcon size={12} />}>
          Output
        </Tabs.Tab>
        <Tabs.Tab value="help" leftSection={<QuestionIcon size={12} />}>
          Help
        </Tabs.Tab>
      </Tabs.List>
      <Box pt="md">
        <Tabs.Panel value="input">
          <Input />
        </Tabs.Panel>
        <Tabs.Panel value="output">{/*<Output />*/}Output</Tabs.Panel>
        <Tabs.Panel value="help">
          <Help />
        </Tabs.Panel>
      </Box>
    </Tabs>
  );
};

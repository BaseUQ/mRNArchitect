import { Combobox, Group, InputBase, useCombobox } from "@mantine/core";
import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useMemo, useState } from "react";
import { type Organism, searchOrganisms } from "~/api";
import { DEFAULT_ORGANISMS } from "~/constants";

interface OrganismSelectProps {
  label: string | null;
  value: Organism;
  onChange: (value: Organism) => void;
}

export const OrganismSelect = ({
  label,
  value,
  onChange,
}: OrganismSelectProps) => {
  const [searchValue, setSearchValue] = useState<string>("");
  const [organisms, setOrganisms] = useState<Organism[]>(DEFAULT_ORGANISMS);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const combobox = useCombobox({
    onDropdownClose: () => {
      combobox.resetSelectedOption();
      combobox.focusTarget();
      setSearchValue("");
    },

    onDropdownOpen: () => {
      combobox.focusSearchInput();
    },
  });

  useEffect(() => {
    if (searchValue) {
      setIsLoading(true);
      searchOrganisms({ terms: searchValue })
        .then(({ organisms }) => setOrganisms(organisms))
        .finally(() => setIsLoading(false));
    } else {
      setOrganisms(DEFAULT_ORGANISMS);
    }
  }, [searchValue]);

  const options = useMemo(() => {
    if (isLoading) {
      return <Combobox.Empty>Loading...</Combobox.Empty>;
    }

    if (searchValue && organisms.length === 0) {
      return <Combobox.Empty>Organism not found</Combobox.Empty>;
    }

    const options = organisms.map((it) => (
      <Combobox.Option
        key={it.slug}
        value={it.slug}
        bg={it.slug === value.slug ? "ghostwhite" : undefined}
      >
        <Group gap="xs">
          {it.slug === value.slug && <CheckIcon size={12} />}
          <span>{it.name}</span>
        </Group>
      </Combobox.Option>
    ));

    if (!searchValue) {
      return (
        <Combobox.Group label="Common organisms">{options}</Combobox.Group>
      );
    }

    return <Combobox.Options>{options}</Combobox.Options>;
  }, [isLoading, organisms, searchValue, value]);

  return (
    <Combobox
      store={combobox}
      position="bottom-start"
      withArrow
      shadow="md"
      onOptionSubmit={(val) => {
        const organism = organisms.find((it) => it.slug === val);
        if (organism) {
          onChange(organism);
        }
        combobox.closeDropdown();
      }}
    >
      <Combobox.Target withAriaAttributes={false}>
        <InputBase
          label={label}
          rightSection={<Combobox.Chevron />}
          rightSectionPointerEvents="none"
          placeholder="Select organism"
          readOnly
          onClick={() => combobox.toggleDropdown()}
          value={value.name}
        />
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Search
          value={searchValue}
          onChange={(event) => setSearchValue(event.currentTarget.value)}
          placeholder="Search organisms (by latin name)"
        />
        <Combobox.Options>{options}</Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
};

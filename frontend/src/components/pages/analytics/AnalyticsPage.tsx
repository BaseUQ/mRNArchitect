import { Button, Fieldset, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useContext } from "react";
import { UserDetails, UserDetailsContext } from "~/context/UserDetails";

export const AnalyticsPage = () => {
  const { userDetails, setUserDetails } = useContext(UserDetailsContext);

  const form = useForm<UserDetails>({
    initialValues: {
      email: userDetails.email,
      name: userDetails.name,
      organization: userDetails.organization,
    },
    validate: (values) => {
      const result = UserDetails.safeParse(values);
      if (result.success) {
        return {};
      }
      return Object.fromEntries(
        result.error.issues
          .filter((issue) => issue.path.length)
          .map((issue) => [issue.path.join("."), issue.message]),
      );
    },
  });

  const handleOnSubmit = (values: UserDetails) => {
    setUserDetails(values);
  };

  return (
    <form onSubmit={form.onSubmit((values) => handleOnSubmit(values))}>
      <Stack gap="xs">
        <Fieldset legend="User details">
          <TextInput
            label="Name"
            required
            key={form.key("name")}
            {...form.getInputProps("name")}
          />
          <TextInput
            label="Email"
            required
            key={form.key("email")}
            {...form.getInputProps("email")}
          />
          <TextInput
            label="Organisation"
            required
            key={form.key("organization")}
            {...form.getInputProps("organization")}
          />
        </Fieldset>
        <Button type="submit" fullWidth>
          Continue to mRNArchitect
        </Button>
      </Stack>
    </form>
  );
};

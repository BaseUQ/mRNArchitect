import { createContext, useEffect, useState } from "react";
import z from "zod/v4";

const LOCAL_STORAGE_KEY = "user-details";

export const UserDetails = z.object({
  email: z.email(),
  name: z.string(),
  organization: z.string(),
});

export type UserDetails = z.infer<typeof UserDetails>;

interface UserDetailsContext {
  userDetails: UserDetails;
  setUserDetails: (userDetails: UserDetails) => void;
  clearUserDetails: () => void;
}

export const UserDetailsContext = createContext<UserDetailsContext>({
  userDetails: { email: "", name: "", organization: "" },
  setUserDetails: () => {},
  clearUserDetails: () => {},
});

export const getUserDetailsLocalStorage = (): UserDetails => {
  try {
    const data = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) ?? "");
    const result = UserDetails.safeParse(data);
    if (result.success) {
      return result.data;
    }
  } catch {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }
  return {
    email: "",
    name: "",
    organization: "",
  };
};

const setUserDetailsLocalStorage = (userDetails: UserDetails) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userDetails));
};

export const UserDetailsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [userDetails, setUserDetails] = useState<UserDetails>(
    getUserDetailsLocalStorage(),
  );

  const clearUserDetails = () =>
    setUserDetails({ email: "", name: "", organization: "" });

  useEffect(() => {
    setUserDetailsLocalStorage(userDetails);
  }, [userDetails]);

  // Load user details from query params on first load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setUserDetails({
      email: params.get("email") ?? userDetails.email,
      name: params.get("name") ?? userDetails.name,
      organization: params.get("organization") ?? userDetails.organization,
    });
  }, []);

  return (
    <UserDetailsContext
      value={{
        userDetails: userDetails,
        setUserDetails,
        clearUserDetails,
      }}
    >
      {children}
    </UserDetailsContext>
  );
};

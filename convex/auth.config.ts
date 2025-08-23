const authConfig = {
  providers: [
    {
      // Replace with your Clerk issuer domain from the "convex" JWT template
      // It should look like: https://your-domain.clerk.accounts.dev
      domain: "https://relevant-dassie-96.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};

export default authConfig;

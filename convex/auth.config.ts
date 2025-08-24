export default {
  providers: [
    {
      // Use environment variable for flexibility between dev and prod
      // Set CLERK_JWT_ISSUER_DOMAIN in Convex Dashboard
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
};

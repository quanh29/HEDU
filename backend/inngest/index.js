import { Inngest } from "inngest";
import User from "../models/User.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "HEDU" });

// Inngest function to save user data to database
const syncUserCreation = inngest.createFunction(
  { id: "Sync-User-Data" },
  { event: "clerk.user.created" },
  async ({ event }) => {
    const { id, firstName, lastName, emailAddresses, image_url} = event.data;
    const UserData = {
      userId: id,
      // if lastName is not provided, fullName will be firstName.
      fullName: lastName ? `${firstName} ${lastName}` : firstName,
      emailAddresses: emailAddresses[0].emailAddress,
      avaUrl: image_url || '',
    };
    console.log("event data", event.data);
    await User.create(UserData);
  }
);

// Create an empty array where we'll export future Inngest functions
export const functions = [syncUserCreation];
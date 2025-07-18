import { Inngest } from "inngest";
import User from "../models/User.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "HEDU" });

// Inngest function to save user data to database
const syncUserCreation = inngest.createFunction(
  { id: "sync-user-data" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url} = event.data;
    const UserData = {
      _id: id,
      // if lastName is not provided, fullName will be firstName.
      fullName: first_name + " " + last_name,
      emailAddress: email_addresses[0].email_address,
      avaUrl: image_url,
    };
    await User.create(UserData);
  }
);

// Create an empty array where we'll export future Inngest functions
export const functions = [syncUserCreation];
import { UserSpec, UserCredentialsSpec, passwordSpec } from "../models/joi-schemas.js";
import { db } from "../models/db.js";

export const accountsController = {
  index: {
    auth: false,
    handler: function (request, h) {
      return h.view("main", { title: "Welcome to venue" });
    },
  },
  showSignup: {
    auth: false,
    handler: function (request, h) {
      return h.view("signup-view", { title: "Sign up for venue" });
    },
  },
  signup: {
    auth: false,
    validate: {
      payload: UserSpec,
      options: { abortEarly: false },
      failAction: function (request, h, error) {
        return h.view("signup-view", { title: "Sign up error", errors: error.details }).takeover().code(400);
      },
    },
    handler: async function (request, h) {
      const user = request.payload;
      await db.userStore.addUser(user);
      return h.redirect("/");
    },
  },
  showLogin: {
    auth: false,
    handler: function (request, h) {
      return h.view("login-view", { title: "Login to venue" });
    },
  },
  login: {
    auth: false,
    validate: {
      payload: UserCredentialsSpec,
      options: { abortEarly: false },
      failAction: function (request, h, error) {
        return h.view("login-view", { title: "Log in error", errors: error.details }).takeover().code(400);
      },
    },
    handler: async function (request, h) {
      const { email, password } = request.payload;
      const user = await db.userStore.getUserByEmail(email);
      if (!user || user.password !== password) {
        return h.redirect("/");
      }
      request.cookieAuth.set({ id: user._id });
      return h.redirect("/dashboard");
    },
  },
  

  settingsView: {
    handler: async function (request, h){
    const loggedInUser = request.auth.credentials;
    const user = await db.userStore.getUserById(loggedInUser._id);
    const users = await db.userStore.getAllUsers();
    
    const viewData = {
      users: users,
      userEmail: user.email,
      userName: user.firstName,
      userSurname: user.lastName,
      userAdmin: user.admin,
    };
    
    return h.view("settings", viewData);
    }
  },
 


  update: {
    
    validate: {
      payload: UserSpec,
      options: { abortEarly: false },
      failAction: function (request, h, error) {
        return h.view("settings", { title: "Update error", errors: error.details }).takeover().code(400);
      },
    },    
    handler: async function (request, h) {
      const loggedInUser = request.auth.credentials;
      const user = await db.userStore.getUserById(loggedInUser._id);
      const updatedUser= {
        email: request.payload.email,
        firstName: request.payload.firstName,
        lastName: request.payload.lastName,
        password: request.payload.password
      };
      await db.userStore.updateUser(user, updatedUser);
     return h.redirect("/dashboard");
    }
  },


  deleteUser: {
    handler: async function (request, h) {
      await db.userStore.deleteUserById(request.params.userid);
      await db.venueStore.deleteAllVenuesByUserId(request.params.userid);
      return h.redirect("/settings");
    },
  },

  updateUser: {
    validate: {
      payload: passwordSpec,
      options: { abortEarly: false },
      failAction: function (request, h, error) {
        return h.view("settings", { title: "Edit info error", errors: error.details }).takeover().code(400);
      },
    },
    handler: async function (request, h) {
      const user = await db.userStore.getUserById(request.params.userid);
      const updatedPassword = {
        password: request.payload.password
      };
      await db.userStore.updatePassword(user, updatedPassword);
      return h.redirect("/settings");
    },
  },
  

  logout: {
    handler: function (request, h) {
      request.cookieAuth.clear();
      return h.redirect("/");
    },
  },

  async validate(request, session) {
    const user = await db.userStore.getUserById(session.id);
    if (!user) {
      return { isValid: false };
    }
    return { isValid: true, credentials: user };
  },
};

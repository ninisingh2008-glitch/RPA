const tables = [
  {
    name: "SitePages",
    description: "Structured page payloads rendered by the public site.",
    fields: [
      { name: "Slug", type: "singleLineText" },
      { name: "Title", type: "singleLineText" },
      { name: "Payload", type: "multilineText" }
    ]
  },
  {
    name: "Tournaments",
    description: "Upcoming and past Rajasthan Pickleball Association events.",
    fields: [
      { name: "Name", type: "singleLineText" },
      { name: "Category", type: "singleLineText" },
      { name: "Date", type: "date" },
      { name: "City", type: "singleLineText" },
      { name: "Venue", type: "singleLineText" },
      { name: "Description", type: "multilineText" },
      { name: "ImageUrl", type: "url" },
      { name: "Status", type: "singleLineText" },
      { name: "RegistrationLink", type: "url" }
    ]
  },
  {
    name: "StateTeam",
    description: "Current state team athletes and support roles.",
    fields: [
      { name: "Name", type: "singleLineText" },
      { name: "Role", type: "singleLineText" },
      { name: "City", type: "singleLineText" },
      { name: "Highlight", type: "multilineText" },
      { name: "ImageUrl", type: "url" },
      { name: "Image", type: "url" }
    ]
  },
  {
    name: "News",
    description: "Official announcements and media updates.",
    fields: [
      { name: "Title", type: "singleLineText" },
      { name: "Category", type: "singleLineText" },
      { name: "Date", type: "date" },
      { name: "Summary", type: "multilineText" },
      { name: "ImageUrl", type: "url" },
      { name: "Link", type: "url" }
    ]
  },
  {
    name: "Partners",
    description: "Partners and supporters featured on the site.",
    fields: [
      { name: "Name", type: "singleLineText" },
      { name: "Type", type: "singleLineText" },
      { name: "Description", type: "multilineText" },
      { name: "ImageUrl", type: "url" },
      { name: "Url", type: "url" }
    ]
  },
  {
    name: "Users",
    description: "Member accounts and content-management roles.",
    fields: [
      { name: "Username", type: "singleLineText" },
      { name: "FullName", type: "singleLineText" },
      { name: "Role", type: "singleLineText" },
      { name: "Email", type: "email" },
      { name: "Status", type: "singleLineText" },
      { name: "PasswordHash", type: "multilineText" }
    ]
  }
];

module.exports = {
  tables
};

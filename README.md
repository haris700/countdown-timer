
Shopify Countdown Timer App

A customizable countdown timer app for Shopify stores, built using the React Router (Remix) template.
This app helps merchants create urgency on their storefront by displaying countdown timers for sales, launches, or limited-time offers.

📌 Project Overview

This application allows Shopify merchants to configure and display countdown timers across their store.

What the app supports

Multiple timer types

Fixed timers for specific events (e.g. Black Friday, flash sales)

Evergreen timers that reset per user session

Flexible targeting

Show timers on all pages

Limit them to specific products or collections

Design customization

Top bar, bottom bar, or static placement

Configurable colors and sizes from the Admin UI

Performance-focused

Minimal logic in the theme extension

Optimized server-side queries for storefront rendering

🛠 Prerequisites

Before running the project, make sure you have the following:

Shopify Partner Account

Required to create a development store and install custom apps

Node.js

Version 18+

MongoDB

Local instance or MongoDB Atlas

Shopify CLI

Installed globally or used via npx

⚙️ Project Setup

The project is already initialized, but this section explains how it was originally set up.

# Authenticate with Shopify
shopify auth login

# Initialize the app using the Remix / React Router template
shopify app init --template=remix

📦 Installation & Running the App
1. Install dependencies
npm install

2. Environment configuration

Create a .env file in the project root:

SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SCOPES=write_products,write_content,write_themes
HOST=your_tunnel_url
MONGODB_URI=mongodb://localhost:27017/shopify-countdown


Most Shopify credentials are automatically populated when running the app with the Shopify CLI.

3. Start development server
npm run dev


This will:

Start the Remix server

Create a Cloudflare tunnel

Prompt you to install the app on your development store

Press p in the terminal to open the preview URL.

4. Run tests
npm run test

🗄 Database Design (MongoDB)

The app uses MongoDB with Mongoose.
The main collection is the Timer model.

Timer Schema
Field	Description
_id	MongoDB ObjectId
shop	Store’s myshopify.com domain (indexed)
name	Internal timer name
type	fixed or evergreen
startAt	Start date (fixed timers)
endAt	End date (fixed timers)
durationMinutes	Duration for evergreen timers
styleConfig	Position, color, and size settings
targeting	Page targeting rules (all / product / collection)
status	active, scheduled, or expired (indexed)
Indexes

{ shop: 1, "targeting.type": 1 }
→ Optimizes storefront timer lookups

{ shop: 1, status: 1 }
→ Improves admin dashboard filtering

🧩 Theme App Extension

Timers are rendered on the storefront using a Shopify Theme App Extension.

Location

extensions/countdown-theme-ext/


Key files

blocks/timer.liquid – Liquid markup for rendering the timer

assets/timer.js – Client-side countdown logic

shopify.extension.toml – Extension configuration

How merchants use it

Enable the Countdown Timer App Embed for global timers

Add the Countdown Section to specific pages via the Theme Editor

🏗 Architecture Choices
Controller-Service pattern (no internal API calls)

Originally, calling internal API routes from Remix loaders caused issues such as:

Authentication redirects

410 Gone errors

Embedded app loopbacks

Current approach

Remix loaders/actions directly import service functions:

import { getTimers, createTimer } from "~/server/routes/admin/timers";


Why this works better

No internal network requests

No auth loopback problems

Cleaner error handling

Better performance

Using .lean() with Mongoose

All read queries use .lean():

const timers = await Timer.find({ shop }).lean();


Benefits

Returns plain JavaScript objects

Avoids Remix serialization issues

Faster and memory-efficient

Cleaner data passed to the client

📝 Assumptions & Limitations

MongoDB is required

The app will not start without a valid database connection

Required Shopify scopes

write_content and write_themes are mandatory

Single-region deployment

No replication or edge caching implemented yet

Would need changes for large-scale/global usage

✅ Summary

This project focuses on:

Clean separation between admin logic and storefront rendering

Avoiding common embedded-app pitfalls

Keeping the theme extension lightweight and fast

Making the app easy to extend with additional timer features

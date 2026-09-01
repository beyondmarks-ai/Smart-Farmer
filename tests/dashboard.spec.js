import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  page.on("pageerror", error => console.log("PAGE_ERROR", error.message));
  page.on("response", response => response.status() >= 400 && console.log("HTTP_ERROR", response.status(), response.url()));
});

async function login(page) {
  await page.goto("/");
  await page.getByLabel("Email address *").fill("browser-test@smartfarmer.invalid");
  await page.getByLabel("Password *").fill("FarmerTest123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Good morning/ })).toBeVisible({ timeout: 15_000 });
}

test("first page provides sign in and registration", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Sign in to SmartFarmer" })).toBeVisible();
  await expect(page.getByLabel("Email address *")).toHaveAttribute("autocomplete", "email");
  await expect(page.getByLabel("Password *")).toHaveAttribute("autocomplete", "current-password");
  await page.getByRole("button", { name: /Create account/ }).click();
  await expect(page.getByRole("heading", { name: "Start your digital farm" })).toBeVisible();
});

test("new farmer completes required onboarding", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Email address *").fill("browser-test@smartfarmer.invalid");
  await page.getByLabel("Password *").fill("FarmerTest123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Tell us about your farm" })).toBeVisible();
  await page.getByLabel("Full name *").fill("Browser Farmer");
  await page.getByLabel("Farm / shop name *").fill("Test Farm Shop");
  await page.getByLabel("Village / city *").fill("Indore");
  await page.getByLabel("State *").fill("Madhya Pradesh");
  await page.getByLabel("Land size (acres) *").fill("5");
  await page.getByLabel("What do you grow? *").fill("Wheat, soybean");
  await page.getByRole("button", { name: "Open farmer dashboard" }).click();
  await expect(page.getByRole("heading", { name: "Good morning, Browser" })).toBeVisible();
});

test("dashboard controls and data workflows respond", async ({ page }) => {
  await login(page);
  await expect(page.getByRole("heading", { name: /Good morning/ })).toBeVisible();
  await expect(page.getByText("Loading weather…")).toHaveCount(0, { timeout: 15_000 });

  for (const [button, title] of [["Scan crop", "Crop image analysis"], ["Nearby farm map", "Nearby farms · satellite"], ["Sell produce", "Sell produce"], ["Find schemes", "Government scheme finder"]]) {
    await page.getByRole("button", { name: new RegExp(button) }).first().click();
    await expect(page.getByRole("dialog").getByRole("heading", { name: title })).toBeVisible();
    await page.keyboard.press("Escape");
  }

  await page.getByRole("button", { name: /Add diary entry/ }).click();
  await page.getByLabel("Activity *").fill("Browser test irrigation");
  await page.getByLabel("Crop *").fill("Wheat");
  await page.getByRole("button", { name: "Save record" }).click();
  await expect(page.getByRole("status")).toContainText("Diary record saved");

  await page.getByRole("button", { name: "Invoices" }).click();
  await page.getByRole("button", { name: /Create invoice/ }).click();
  await page.getByLabel("Buyer *").fill("Browser Test Buyer");
  await page.getByLabel("Crop *").fill("Wheat");
  await page.getByLabel("Quantity (quintal) *").fill("2");
  await page.getByLabel("Rate (₹/quintal) *").fill("2500");
  await page.getByRole("button", { name: "Create invoice", exact: true }).click();
  await expect(page.getByRole("link", { name: /Download invoice PDF/ })).toBeVisible({ timeout: 15_000 });
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Explore market" }).click();
  await expect(page.getByRole("dialog")).toContainText("₹", { timeout: 10_000 });
  await page.keyboard.press("Escape");

  await page.getByLabel("Ask the farm assistant").fill("Give one short wheat tip");
  await page.getByLabel("Send question").click();
  await expect(page.locator(".assistant-reply")).not.toBeEmpty({ timeout: 20_000 });

  await page.getByLabel("Notifications").click();
  await expect(page.getByRole("dialog")).toContainText("Weather updated");
});

test("mobile navigation opens and routes", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await login(page);
  await page.getByLabel("Open menu").click();
  await expect(page.getByRole("button", { name: "Farm diary" })).toBeVisible();
  await page.getByRole("button", { name: "Farm diary" }).click();
  await expect(page.getByRole("dialog").getByRole("heading", { name: "Farm diary" })).toBeVisible();
});

test("crop vision, schemes, profile, search and language respond", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: /Scan crop/ }).click();
  await page.getByLabel(/Choose a clear crop photo/).setInputFiles("tests/pixel.png");
  await page.getByRole("button", { name: "Upload and analyze" }).click();
  await expect(page.locator(".result")).not.toContainText("Uploading and analyzing", { timeout: 30_000 });
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: /Find schemes/ }).click();
  await page.getByRole("button", { name: "Find schemes", exact: true }).click();
  await expect(page.locator(".result")).not.toContainText("Searching schemes", { timeout: 30_000 });
  await page.keyboard.press("Escape");

  await page.locator(".profile").click();
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByRole("status")).toContainText("Profile updated");

  await page.getByRole("button", { name: "English" }).click();
  await expect(page.getByRole("button", { name: "Hindi" })).toBeVisible();
  await page.getByRole("searchbox", { name: "Search" }).fill("produce");
  await page.getByRole("searchbox", { name: "Search" }).press("Enter");
  await expect(page.getByRole("dialog")).toContainText("Sell produce");
});

test("farmer publishes and customer buys produce", async ({ browser }) => {
  const farmer = await browser.newPage();
  await login(farmer);
  await farmer.getByRole("button", { name: /Sell produce/ }).first().click();
  await farmer.getByLabel("Crop / produce *").fill("Test organic wheat");
  await farmer.getByLabel("Available quantity (quintal) *").fill("10");
  await farmer.getByLabel("Price (₹/quintal) *").fill("2450");
  await farmer.getByRole("button", { name: "Publish for customers" }).click();
  await expect(farmer.getByRole("status")).toContainText("visible to customers");

  const customer = await browser.newPage();
  await customer.goto("/");
  await customer.getByLabel("Email address *").fill("browser-buyer@smartfarmer.invalid");
  await customer.getByLabel("Password *").fill("BuyerTest123");
  await customer.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(customer.getByRole("heading", { name: "Produce near you" })).toBeVisible({ timeout: 15_000 });
  const card=customer.locator(".listing-card").filter({hasText:"Test organic wheat"}).first();
  await card.getByRole("button", { name: "Buy from farmer" }).click();
  await customer.getByLabel("Quantity (quintal) *").fill("2");
  await customer.getByRole("button", { name: "Pay securely with Razorpay" }).click();
  await expect(customer.getByText("Opening secure checkout…")).toBeVisible();
});

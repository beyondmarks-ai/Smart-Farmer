import "./globals.css";

export const metadata = {
  title: "SmartFarmer — Your farm, smarter",
  description: "A simple digital farm companion for weather, crops, prices and records."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

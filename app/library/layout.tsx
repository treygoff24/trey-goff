import { connection } from "next/server";

export default async function LibraryLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	// Keep this route dynamic so nonce-based CSP can be attached to framework inline scripts.
	await connection();
	return <>{children}</>;
}

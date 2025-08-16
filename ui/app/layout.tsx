import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'the list',
    description: 'USDT & USDC blacklist dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className="min-h-screen bg-terminal-bg text-terminal-text font-mono">
                {children}
            </body>
        </html>
    );
}




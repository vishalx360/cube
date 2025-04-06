import { useEffect, useRef } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { getWebSocketUrl } from '@/lib/api';
import 'xterm/css/xterm.css';

interface TerminalProps {
    containerId: string;
}

export default function Terminal({ containerId }: TerminalProps) {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<XTerm | null>(null);

    useEffect(() => {
        if (!terminalRef.current) return;

        // Initialize xterm.js
        const term = new XTerm({
            cursorBlink: true,
            theme: {
                background: '#1a1b26',
                foreground: '#a9b1d6',
            },
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.loadAddon(new WebLinksAddon());

        term.open(terminalRef.current);
        fitAddon.fit();
        xtermRef.current = term;

        // Connect to WebSocket
        const ws = new WebSocket(getWebSocketUrl(containerId));

        ws.onopen = () => {
            term.writeln('Connected to database terminal...');
        };

        ws.onmessage = (event) => {
            term.write(event.data);
        };

        ws.onerror = () => {
            term.writeln('WebSocket error occurred');
        };

        ws.onclose = () => {
            term.writeln('Connection closed');
        };

        // Handle terminal input
        term.onData((data) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(data);
            }
        });

        // Handle window resize
        const handleResize = () => fitAddon.fit();
        window.addEventListener('resize', handleResize);

        return () => {
            term.dispose();
            ws.close();
            window.removeEventListener('resize', handleResize);
        };
    }, [containerId]);

    return (
        <div className="w-full h-full min-h-[400px] bg-[#1a1b26] rounded-lg overflow-hidden">
            <div ref={terminalRef} className="w-full h-full" />
        </div>
    );
} 
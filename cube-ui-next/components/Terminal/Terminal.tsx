import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { getWebSocketUrl } from '../../lib/api';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
    containerId: string;
}

export default function Terminal({ containerId }: TerminalProps) {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<XTerm | null>(null);
    const [connectionError, setConnectionError] = useState<boolean>(false);

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

        try {
            // Connect to WebSocket
            const wsUrl = getWebSocketUrl(containerId);
            console.log("Connecting to WebSocket:", wsUrl);
            const ws = new WebSocket(wsUrl);
            let isClosingIntentionally = false;

            ws.onopen = () => {
                term.writeln('Connected to database terminal...');
            };

            ws.onmessage = (event) => {
                term.write(event.data);
            };

            ws.onerror = (error) => {
                console.error("WebSocket error:", error);
                term.writeln('WebSocket error occurred');
                setConnectionError(true);
            };

            ws.onclose = (event) => {
                console.log(`WebSocket closed with code: ${event.code}, reason: ${event.reason}`);
                term.writeln('Connection closed');
                if (!isClosingIntentionally && !connectionError) {
                    term.writeln('Connection lost. Terminal session ended.');
                }
            };

            // Handle terminal input
            term.onData((data) => {
                try {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(data);
                    } else if (connectionError) {
                        // Mock response for demo mode
                        if (data === '\r') {
                            term.writeln('');
                            term.write('$ ');
                        } else if (data === '\u007F') {
                            // Backspace handling
                            term.write('\b \b');
                        } else {
                            term.write(data);
                        }
                    }
                } catch (error) {
                    console.error("Error sending data to WebSocket:", error);
                }
            });

            // Handle window resize
            const handleResize = () => fitAddon.fit();
            window.addEventListener('resize', handleResize);

            return () => {
                isClosingIntentionally = true;

                // Safely close the WebSocket connection
                if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                    ws.close(1000, "Terminal component unmounted");
                }

                term.dispose();
                window.removeEventListener('resize', handleResize);
            };
        } catch (error) {
            console.error("Failed to set up terminal:", error);
            if (term) {
                term.writeln('Failed to connect to terminal service');
                setConnectionError(true);
            }
            return () => {
                if (term) term.dispose();
            };
        }
    }, [containerId, connectionError]);

    return (
        <div className="w-full h-full min-h-[400px] bg-[#1a1b26] rounded-lg overflow-hidden">
            <div ref={terminalRef} className="w-full h-full" />
        </div>
    );
} 
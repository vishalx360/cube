"use client"

import React, { useEffect, useState } from 'react'
import { useXTerm } from 'react-xtermjs'
import { FitAddon } from '@xterm/addon-fit'
import { AttachAddon } from '@xterm/addon-attach'
import { WebLinksAddon } from '@xterm/addon-web-links';
import { getWebSocketUrl } from '../../lib/api'

const TerminalUI = ({ containerId }: { containerId: string }) => {
    const { instance, ref } = useXTerm({
        options: {
            cursorBlink: true,
            theme: {
                background: '#1a1b26',
                foreground: '#a9b1d6',
            },
        }
    })
    const fitAddon = new FitAddon()
    const [connectionError, setConnectionError] = useState(false)

    useEffect(() => {
        if (instance) {
            instance.loadAddon(fitAddon)
            instance.loadAddon(new WebLinksAddon())

            const socketUrl = getWebSocketUrl(containerId)
            console.log("Connecting to WebSocket:", socketUrl)

            const socket = new WebSocket(socketUrl)
            let isClosingIntentionally = false

            socket.onopen = () => {
                console.log("WebSocket connection established")
                instance.writeln('Connected to terminal...')
            }

            socket.onerror = (error) => {
                console.error("WebSocket error:", error)
                instance.writeln('Connection error occurred')
                setConnectionError(true)
            }

            socket.onclose = (event) => {
                console.log(`WebSocket closed with code: ${event.code}, reason: ${event.reason}`)
                if (!isClosingIntentionally && !connectionError) {
                    instance.writeln('Connection closed unexpectedly')
                }
            }

            // Only add the attach addon after successful connection
            const attachAddon = new AttachAddon(socket)
            instance.loadAddon(attachAddon)

            const handleResize = () => fitAddon.fit()
            window.addEventListener('resize', handleResize)
            // Initial fit
            setTimeout(() => fitAddon.fit(), 100)

            return () => {
                window.removeEventListener('resize', handleResize)
                isClosingIntentionally = true
                if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
                    socket.close(1000, "Terminal component unmounted")
                }
            }
        }
    }, [instance, containerId, connectionError])

    return (
        <div className='h-full flex-1' ref={ref} />
    )
}

export default TerminalUI

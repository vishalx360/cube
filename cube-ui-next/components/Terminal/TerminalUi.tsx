"use client"

import { useEffect } from 'react'
import { useXTerm } from 'react-xtermjs'
import { FitAddon } from '@xterm/addon-fit'
import { AttachAddon } from '@xterm/addon-attach'
import { WebLinksAddon } from '@xterm/addon-web-links';
import { getWebSocketUrl } from '@/lib/api'



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

    useEffect(() => {
        if (instance) {
            instance.loadAddon(fitAddon)
            instance.loadAddon(new WebLinksAddon())

            const socket = new WebSocket(getWebSocketUrl(containerId))
            const attachAddon = new AttachAddon(socket)

            instance.loadAddon(attachAddon)
            const handleResize = () => fitAddon.fit()
            window.addEventListener('resize', handleResize)

            return () => {
                window.removeEventListener('resize', handleResize)
                socket.close()
            }
        }
    }, [instance, containerId])

    return (
        <div className='h-full flex-1' ref={ref} />
    )
}

export default TerminalUI

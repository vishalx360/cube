"use client"

import TerminalUI from "./TerminalUi"
import { Button } from '../../components/ui/button'
import { Tabs, TabsContent, TabsList } from "../../components/ui/tabs"
import { nanoid } from 'nanoid'
import { useState } from 'react'
import { FaPlus } from 'react-icons/fa'
import '@xterm/xterm/css/xterm.css'
import TerminalTabsList from './TerminalTabsList'

export default function TerminalWindow() {
    const [tabs, setTabs] = useState([{ id: nanoid(), label: 'Terminal 1' }])
    const [activeTab, setActiveTab] = useState(tabs[0]?.id)

    // Function to add a new tab
    const addTab = () => {
        const newTabId = nanoid()
        const newTab = {
            id: newTabId,
            label: `Terminal ${tabs.length + 1}`
        }
        setTabs([...tabs, newTab])
        setActiveTab(newTab.id) // Set newly added tab as active
    }

    // Function to close a tab
    const closeTab = (tabId: string) => {
        const tabIndex = tabs.findIndex(tab => tab.id === tabId); // Find the index of the closing tab
        const updatedTabs = tabs.filter(tab => tab.id !== tabId);
        setTabs(updatedTabs);

        if (activeTab === tabId) {
            // If the closed tab was the active one, find the next active tab
            if (tabIndex < updatedTabs.length) {
                // Set the next tab to the right if available
                setActiveTab(updatedTabs[tabIndex]?.id || updatedTabs[tabIndex - 1]?.id || '');
            } else {
                // Otherwise, set the previous tab to the left
                setActiveTab(updatedTabs[tabIndex - 1]?.id || '');
            }
        }
    };

    return (
        <Tabs
            defaultValue={activeTab}
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full  h-full p-1 relative ">
            <TabsList className='absolute z-10 top-0 right-0 p-2 h-fit bg-gray-800 w-full justify-start items-center' aria-label="Tabs">
                <TerminalTabsList activeTab={activeTab} tabs={tabs} onCloseTab={closeTab} onReorderTabs={setTabs} onTabClick={setActiveTab} />
                <Button
                    onClick={addTab}
                    variant="secondary"
                    size={'icon'}
                    className='ml-2  rounded-full bg-white/20 text-white'
                >
                    <FaPlus size={"0.6em"} />
                </Button>
            </TabsList>
            {/* Tabs Content */}
            {tabs.map((tab) => (
                <TabsContent
                    className="pt-16 h-full"
                    key={tab.id}
                    value={tab.id}
                    forceMount hidden={tab.id !== activeTab}
                >
                    <TerminalUI />
                </TabsContent>
            ))}
        </Tabs>
    )
}

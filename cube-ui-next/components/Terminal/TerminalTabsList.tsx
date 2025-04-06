import { Reorder } from "framer-motion"
import { TabsTrigger } from "@/components/ui/tabs"
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface TerminalTabsListProps {
  tabs: { id: string; label: string }[];
  activeTab: string;
  onTabClick: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onReorderTabs: (tabs: { id: string; label: string }[]) => void;
}

export default function TerminalTabsList({
  tabs,
  onTabClick,
  onCloseTab,
  onReorderTabs,
}: TerminalTabsListProps) {
  return (
    <Reorder.Group axis="x" values={tabs} onReorder={onReorderTabs} className="overflow-x-scroll flex tablist">
      {tabs.map((tab) => (
        <Reorder.Item key={tab.id} value={tab} className="flex items-center">
          <div className={cn('flex justify-center items-center cursor-pointer')}>
            <TabsTrigger
              value={tab.id}
              className={cn('data-[state=active]:bg-green-800 data-[state=active]:text-green-200')}
              onClick={() => onTabClick(tab.id)}
            >
              <h1>{tab.label}</h1>
            </TabsTrigger>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(tab.id);
              }}
              className={"bg-transparent hover:bg-white/10 p-0 px-2 text-white"}
              variant="secondary"
              size={'sm'}
            >
              X
            </Button>
          </div>
        </Reorder.Item>
      ))}
    </Reorder.Group>
  );
}

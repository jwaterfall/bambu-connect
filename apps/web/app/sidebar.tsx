"use client";

import { FC, PropsWithChildren, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { House, Printer, Folder, Settings, LucideIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useConnector } from "./connector";

const SidebarLink: FC<
  PropsWithChildren<{ href: string; icon: LucideIcon }>
> = ({ children, href, icon: Icon }) => (
  <Link href={href} className="flex items-center gap-2">
    <Icon size={24} />
    {children}
  </Link>
);

export const Sidebar: FC = () => {
  const { selectedPrinter, setSelectedPrinterId, printers } = useConnector();

  return (
    <aside className="w-80 h-full bg-muted-background text-muted-foreground border-r">
      <div className="py-12 flex flex-col items-center">
        <Image src="/logo.png" alt="Logo" width={256} height={128} />
      </div>
      <div className="px-6">
        <div className="rounded-md border mb-6 overflow-hidden">
          <Image
            src={`/printers/${selectedPrinter?.manufacturer}/${selectedPrinter?.model}.png`}
            alt="Printer"
            width={128}
            height={128}
          />
          <Select
            value={selectedPrinter?.id}
            onValueChange={setSelectedPrinterId}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a printer..." />
            </SelectTrigger>
            <SelectContent>
              {printers.map((printer) => (
                <SelectItem key={printer.id} value={printer.id}>
                  {printer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <nav className="flex flex-col gap-2">
          <SidebarLink href="/" icon={House}>
            Home
          </SidebarLink>
          <SidebarLink href="/files" icon={Folder}>
            Files
          </SidebarLink>
          <SidebarLink href="/printers" icon={Printer}>
            Printers
          </SidebarLink>
          <SidebarLink href="/settings" icon={Settings}>
            Settings
          </SidebarLink>
        </nav>
      </div>
    </aside>
  );
};

"use client";

import { useState, useMemo, SetStateAction } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox";
import { TableCell } from "@/components/ui/table";
import Image from "next/image";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowUp } from "@phosphor-icons/react";
type Lead = {
    profile: string;
    name: string;
    username: string;
    messages: number;
    lastSeen: string;
};
export default function ContactListCard() {
    const [search, setSearch] = useState("");
    const [sortColumn, setSortColumn] = useState<keyof Lead>("messages");
    const [sortDirection, setSortDirection] = useState("desc");
    const [selectedLeads, setSelectedLeads] = useState<any[]>([]);

    const handleSearch = (e: { target: { value: SetStateAction<string> } }) => {
        setSearch(e.target.value);
    };

    const handleSort = (column: keyof Lead) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortColumn(column);
            setSortDirection("asc");
        }
    };

    const handleSelect = (lead: any) => {
        if (selectedLeads.includes(lead)) {
            setSelectedLeads(selectedLeads.filter((item) => item !== lead));
        } else {
            setSelectedLeads([...selectedLeads, lead]);
        }
    };

    const filteredLeads: Lead[] = useMemo(() => {
        return [
            {
                profile: "https://github.com/shadcn.png",
                name: "سینا پیرانی",
                username: "@sina_pirani",
                messages: 125,
                lastSeen: "2h ago",
            },
            {
                profile: "https://github.com/shadcn.png",
                name: "فاطمه سلیمانی",
                username: "@fatemehsoleimani",
                messages: 78,
                lastSeen: "2h ago",
            },
            {
                profile: "https://github.com/shadcn.png",
                name: "مریم احمدی",
                username: "@nazi",
                messages: 52,
                lastSeen: "2h ago",
            },
            {
                profile: "https://github.com/shadcn.png",
                name: "محمد عمرانی",
                username: "@michael_johnson",
                messages: 32,
                lastSeen: "2h ago",
            },
            {
                profile: "https://github.com/shadcn.png",
                name: "احسان فقیهی",
                username: "@emily_martinez",
                messages: 18,
                lastSeen: "2h ago",
            },
            {
                profile: "https://github.com/shadcn.png",
                name: "سینا پیرانی",
                username: "@sina_pirani",
                messages: 125,
                lastSeen: "2h ago",
            },
            {
                profile: "https://github.com/shadcn.png",
                name: "فاطمه سلیمانی",
                username: "@fatemehsoleimani",
                messages: 78,
                lastSeen: "2h ago",
            },
            {
                profile: "https://github.com/shadcn.png",
                name: "مریم احمدی",
                username: "@nazi",
                messages: 52,
                lastSeen: "2h ago",
            },
            {
                profile: "https://github.com/shadcn.png",
                name: "محمد عمرانی",
                username: "@michael_johnson",
                messages: 32,
                lastSeen: "2h ago",
            },
            {
                profile: "https://github.com/shadcn.png",
                name: "احسان فقیهی",
                username: "@emily_martinez",
                messages: 18,
                lastSeen: "2h ago",
            },
            {
                profile: "https://github.com/shadcn.png",
                name: "سینا پیرانی",
                username: "@sina_pirani",
                messages: 125,
                lastSeen: "2h ago",
            },
            {
                profile: "https://github.com/shadcn.png",
                name: "فاطمه سلیمانی",
                username: "@fatemehsoleimani",
                messages: 78,
                lastSeen: "2h ago",
            },
            {
                profile: "https://github.com/shadcn.png",
                name: "مریم احمدی",
                username: "@nazi",
                messages: 52,
                lastSeen: "2h ago",
            },
            {
                profile: "https://github.com/shadcn.png",
                name: "محمد عمرانی",
                username: "@michael_johnson",
                messages: 32,
                lastSeen: "2h ago",
            },
            {
                profile: "https://github.com/shadcn.png",
                name: "احسان فقیهی",
                username: "@emily_martinez",
                messages: 18,
                lastSeen: "2h ago",
            },
        ]
            .filter((lead) => lead.name.toLowerCase().includes(search.toLowerCase()))
            .sort((a, b) => {
                if (a[sortColumn] < b[sortColumn])
                    return sortDirection === "asc" ? -1 : 1;
                if (a[sortColumn] > b[sortColumn])
                    return sortDirection === "asc" ? 1 : -1;
                return 0;
            });
    }, [search, sortColumn, sortDirection]);

    return (
        <div className="_wrap flex flex-col gap-2 h-[calc(100%-40px)] max-h-[calc(100%-40px)]">
            <div className="_filterSection">
                <Input
                    type="search"
                    placeholder="جستجو ..."
                    value={search}
                    onChange={handleSearch}
                    className="flex-1"
                />
            </div>

            <div className="_contact-list h-[calc(100%-48px)] max-h-[calc(100%-48px)]">
                <Table className="scroll h-full max-h-full">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-7 text-right">
                                <Checkbox
                                    checked={selectedLeads.length === filteredLeads.length}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            setSelectedLeads(filteredLeads?.map((lead) => lead));
                                        } else {
                                            setSelectedLeads([]);
                                        }
                                    }}
                                />
                            </TableHead>
                            <TableHead className="w-10"></TableHead>
                            <TableHead
                                onClick={() => handleSort("name")}
                                className="cursor-pointer text-right hover:text-black"
                            >
                                نام کاربر
                                {sortColumn === "name" && (
                                    <span className="mr-2">
                                        {sortDirection === "asc" ? "\u2191" : "\u2193"}
                                    </span>
                                )}
                            </TableHead>
                            {/* <TableHead
                                className="cursor-pointer text-right"
                                onClick={() => handleSort("messages")}
                            >
                                پیام‌ها
                                {sortColumn === "messages" && (
                                    <span className="ml-2">
                                        {sortDirection === "asc" ? "\u2191" : "\u2193"}
                                    </span>
                                )}
                            </TableHead> */}
                        </TableRow>
                    </TableHeader>
                    <TableBody className="h-[calc(100%-40px)] max-h-[calc(100%-40px)]">
                        {filteredLeads.map((lead, index) => (
                            <TableRow
                                key={index}
                                className={selectedLeads.includes(lead) ? "bg-muted" : ""}
                            >
                                <TableCell>
                                    <Checkbox
                                        checked={selectedLeads.includes(lead)}
                                        onCheckedChange={() => handleSelect(lead)}
                                    />
                                </TableCell>

                                <TableCell>
                                    <Image
                                        src={lead.profile}
                                        alt={`${lead.name} profile`}
                                        width={32}
                                        height={32}
                                        className="rounded-full"
                                    />
                                </TableCell>

                                <TableCell>
                                    <div className="flex flex-col">
                                        <div className="font-medium">{lead.name}</div>
                                        <div className="text-xs text-gray-500 font-light text-right" dir="ltr">
                                            {lead.username}
                                        </div>
                                    </div>
                                </TableCell>

                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

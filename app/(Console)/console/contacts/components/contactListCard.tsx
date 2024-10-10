"use client";

import { useState, useMemo, SetStateAction } from "react";
import { Input } from "@/components/ui/input";
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
import Link from "next/link";
import { PenNibStraight } from "@phosphor-icons/react/dist/ssr";
import { Pencil, Trash } from "@phosphor-icons/react";
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
                name: "سینا پیرانی",
                username: "@sina_pirani",
                messages: 125,
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
                name: "سینا پیرانی",
                username: "@sina_pirani",
                messages: 125,
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

            <div className="_contact-list h-[calc(100%-44px)] max-h-[calc(100%-44px)]">
                <Table className="scroll h-full max-h-full">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-right w-[5%]">
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
                            <TableHead className="w-[15%] text-center">
                                تصویر
                            </TableHead>
                            <TableHead
                                onClick={() => handleSort("name")}
                                className="cursor-pointer text-center hover:text-black w-[25%]"
                            >
                                نام کاربر
                                {sortColumn === "name" && (
                                    <span className="mr-2">
                                        {sortDirection === "asc" ? "\u2191" : "\u2193"}
                                    </span>
                                )}
                            </TableHead>
                            <TableHead
                                className="cursor-pointer text-center hover:text-black w-[25%]"
                                onClick={() => handleSort("username")}
                            >
                                آیدی اینستاگرام
                                {sortColumn === "username" && (
                                    <span className="mr-2">
                                        {sortDirection === "asc" ? "\u2191" : "\u2193"}
                                    </span>
                                )}
                            </TableHead>
                            <TableHead
                                className="cursor-pointer text-center hover:text-black w-[10%]"
                                onClick={() => handleSort("messages")}
                            >
                                تعداد پیام
                                {sortColumn === "messages" && (
                                    <span className="mr-2">
                                        {sortDirection === "asc" ? "\u2191" : "\u2193"}
                                    </span>
                                )}
                            </TableHead>
                            <TableHead
                                className="cursor-pointer text-center hover:text-black w-[10%]"
                                onClick={() => handleSort("lastSeen")}
                            >
                                آخرین خوانش
                                {sortColumn === "lastSeen" && (
                                    <span className="mr-2">
                                        {sortDirection === "asc" ? "\u2191" : "\u2193"}
                                    </span>
                                )}
                            </TableHead>
                            <TableHead className="text-center w-[10%]">
                                عملیات
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="h-[calc(100%-40px)] max-h-[calc(100%-40px)]">
                        {filteredLeads.map((lead, index) => (
                            <TableRow
                                key={index}
                                className={selectedLeads.includes(lead) ? "bg-muted" : ""}
                            >
                                <TableCell className="w-[5%]">
                                    <Checkbox
                                        checked={selectedLeads.includes(lead)}
                                        onCheckedChange={() => handleSelect(lead)}
                                    />
                                </TableCell>

                                <TableCell className="w-[15%]">
                                    <Link className="flex justify-center" href={'/console/contacts/item'}>
                                        <Image
                                            src={lead.profile}
                                            alt={`${lead.name} profile`}
                                            width={32}
                                            height={32}
                                            className="rounded-full"
                                        />
                                    </Link>
                                </TableCell>

                                <TableCell className="w-[25%] text-center">
                                    <Link href={'/console/contacts/item'}>
                                        {lead.name}
                                    </Link>
                                </TableCell>

                                <TableCell className="w-[25%] text-center"><span dir="ltr">{lead.username}</span></TableCell>

                                <TableCell className="w-[10%] text-center">{lead.messages}</TableCell>

                                <TableCell className="w-[10%] text-center">{lead.lastSeen}</TableCell>

                                <TableCell className="w-[10%] text-center">
                                    <div className="flex gap-2 justify-center">
                                        <Pencil size={20} weight="light" className="text-gray-600 hover:text-green-700 cursor-pointer" />
                                        <Trash size={20} weight="light" className="text-gray-600 hover:text-red-700 cursor-pointer" />
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

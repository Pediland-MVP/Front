"use client";

import { useState, useMemo, SetStateAction } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { TableCell } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUp, Eye } from "@phosphor-icons/react";
import Image from "next/image";
type Lead = {
  profile: string;
  name: string;
  username: string;
  messages: number;
  lastSeen: string;
};
export default function ContentCycleLeads() {
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
        name: "sina pirani",
        username: "@sina_pirani",
        messages: 125,
        lastSeen: "2h ago",
      },
      {
        profile: "https://github.com/shadcn.png",
        name: "Fatemeh soleimani",
        username: "@fatemehsoleimani",
        messages: 78,
        lastSeen: "2h ago",
      },
      {
        profile: "https://github.com/shadcn.png",
        name: "nazi",
        username: "@nazi",
        messages: 52,
        lastSeen: "2h ago",
      },
      {
        profile: "https://github.com/shadcn.png",
        name: "Michael ",
        username: "@michael_johnson",
        messages: 32,
        lastSeen: "2h ago",
      },
      {
        profile: "https://github.com/shadcn.png",
        name: "Emily ",
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
    <Card className="w-ful shadow-none border-none">
      <CardHeader>
        <CardTitle>لیدهای اینستاگرام</CardTitle>
        <CardDescription>مدیریت لیدهای اینستاگرام شما</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-8 items-center mb-4">
          <Input
            type="search"
            placeholder="جستجو ..."
            value={search}
            onChange={handleSearch}
            className="flex-1 mr-4"
          />
          <div className="relative">
            {" "}
            {/* Ensure dropdown stays in place */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex py-[19px] items-center gap-2"
                >
                  <ArrowUp size={18} color="#0e0d0e" /> مرتب‌سازی بر اساس{" "}
                  {sortColumn === "messages" ? "پیام‌ها" : "نام"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuRadioGroup value={sortColumn}>
                  <DropdownMenuRadioItem
                    value="name"
                    // onClick={() => handleSort("name")}
                  >
                    نام
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem
                    value="messages"
                    // onClick={() => handleSort("messages")}
                  >
                    پیام‌ها
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px] text-center">
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
              <TableHead
                onClick={() => handleSort("name")}
                className="cursor-pointer text-right"
              >
                کاربر
                {sortColumn === "name" && (
                  <span className="ml-2">
                    {sortDirection === "asc" ? "\u2191" : "\u2193"}
                  </span>
                )}
              </TableHead>
              <TableHead className="text-right">اخرین پیام</TableHead>
              <TableHead
                className="cursor-pointer text-right"
                onClick={() => handleSort("messages")}
              >
                پیام‌ها
                {sortColumn === "messages" && (
                  <span className="ml-2">
                    {sortDirection === "asc" ? "\u2191" : "\u2193"}
                  </span>
                )}
              </TableHead>
              <TableHead className="w-[100px] text-center ">اقدامات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.map((lead, index) => (
              <TableRow
                key={index}
                className={selectedLeads.includes(lead) ? "bg-muted" : ""}
              >
                <TableCell className="text-center">
                  <Checkbox
                    checked={selectedLeads.includes(lead)}
                    onCheckedChange={() => handleSelect(lead)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex gap-4 items-center">
                    <Image
                      src={lead.profile}
                      alt={`${lead.name} profile`}
                      width={42}
                      height={42}
                      className="rounded-full mr-3"
                    />
                    <div className="flex flex-col">
                      <div className="font-medium">{lead.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {lead.username}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{lead.lastSeen}</TableCell>
                <TableCell className="text-right">{lead.messages}</TableCell>
                <TableCell className="text-center">
                  <Button variant="ghost" size="icon">
                    <Eye size={14} color="#111011" />
                    <span className="sr-only">مشاهده جزئیات</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

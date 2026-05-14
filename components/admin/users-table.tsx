"use client";

import "@/api/client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from "lucide-react";

import { listUsersOptions } from "@/api/generated/@tanstack/react-query.gen";
import type { ListUsersUserDto } from "@/api/generated";
import { RoleBadge } from "@/components/admin/role-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebouncedValue } from "@/lib/use-debounced-value";

const DEFAULT_PAGE_SIZE = 20;

const columnHelper = createColumnHelper<ListUsersUserDto>();

const columns = [
  columnHelper.accessor("displayName", {
    header: "Name",
    cell: ({ row, getValue }) => (
      <Link
        href={`/admin/users/${row.original.userId}`}
        className="font-medium underline-offset-4 hover:underline"
      >
        {getValue() || row.original.email}
      </Link>
    ),
  }),
  columnHelper.accessor("email", {
    header: "Email",
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">{getValue()}</span>
    ),
  }),
  columnHelper.accessor("role", {
    header: "Role",
    cell: ({ getValue }) => <RoleBadge role={getValue()} />,
  }),
];

function toNumber(value: number | string) {
  return typeof value === "string" ? Number.parseInt(value, 10) : value;
}

export function UsersTable() {
  const { push } = useRouter();
  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1).withOptions({ clearOnDefault: true }),
  );
  const [search, setSearch] = useQueryState(
    "search",
    parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
  );
  const debouncedSearch = useDebouncedValue(search, 300);

  const query = useQuery({
    ...listUsersOptions({
      query: {
        page,
        pageSize: DEFAULT_PAGE_SIZE,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      },
    }),
    placeholderData: (previous) => previous,
  });

  const data = useMemo(() => query.data?.users ?? [], [query.data]);
  const totalCount = query.data ? toNumber(query.data.totalCount) : 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / DEFAULT_PAGE_SIZE));

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Users</h2>
          <p className="text-xs text-muted-foreground">
            {totalCount} total · page {page} of {totalPages}
          </p>
        </div>
        <div className="relative w-full max-w-xs">
          <SearchIcon className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search users"
            placeholder="Search by name or email"
            className="pl-8"
            value={search}
            onChange={(event) => {
              void setSearch(event.target.value || null);
              void setPage(1);
            }}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {query.isLoading ? (
            <div className="grid gap-2 p-4">
              <Skeleton className="h-6" />
              <Skeleton className="h-6" />
              <Skeleton className="h-6" />
            </div>
          ) : data.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No users match this search</EmptyTitle>
                <EmptyDescription>
                  Try a different name or email.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((group) => (
                  <TableRow key={group.id}>
                    {group.headers.map((header) => (
                      <TableHead key={header.id}>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer hover:bg-accent/40"
                    onClick={(event) => {
                      const target = event.target as HTMLElement;
                      if (target.closest("a, button")) {
                        return;
                      }
                      push(`/admin/users/${row.original.userId}`);
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        {query.isFetching ? <Spinner className="size-3" /> : null}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page <= 1 || query.isFetching}
        >
          <ChevronLeftIcon />
          Prev
        </Button>
        <span className="text-xs text-muted-foreground">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages || query.isFetching}
        >
          Next
          <ChevronRightIcon />
        </Button>
      </div>
    </div>
  );
}

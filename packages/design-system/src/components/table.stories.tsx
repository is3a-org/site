import type { ReactElement } from "react";

import type { Meta } from "@storybook/react-vite";

import { Badge } from "./badge";
import {
  Table,
  TableCaption,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableFooter,
} from "./table";

const meta = { title: "Data display/Table" } satisfies Meta;
export default meta;

export function Members(): ReactElement {
  return (
    <div className="max-w-2xl">
      <Table>
        <TableCaption>Example member overview.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Membership</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">Alex de Vries</TableCell>
            <TableCell>Full</TableCell>
            <TableCell>
              <Badge>Active</Badge>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Sam Jansen</TableCell>
            <TableCell>Flex</TableCell>
            <TableCell>
              <Badge variant="secondary">Pending</Badge>
            </TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3}>2 members</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}

import Link from "next/link";
import { StateBlock } from "@doneisbetter/gds-core/server";
import { Button, Center, Paper } from "@mantine/core";

export default function NotFound() {
  return (
    <Center mih="100vh" bg="beige.0" px="md">
      <Paper withBorder p="xl" maw={480} w="100%">
        <StateBlock
          variant="empty"
          title="Page not found"
          description="The page you requested does not exist or may have moved."
          action={
            <Button component={Link} href="/" color="teal">
              Return home
            </Button>
          }
        />
      </Paper>
    </Center>
  );
}

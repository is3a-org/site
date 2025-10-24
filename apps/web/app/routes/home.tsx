import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import { DummyRepository } from "~/dummy/dummy";
import { createIs3aD1 } from "~/db/is3a-d1/is3a-d1";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export async function loader({ context }: Route.LoaderArgs) {
  const dummyRepository = new DummyRepository(createIs3aD1(context.cloudflare.env.IS3A_D1));

  const newDummy = await dummyRepository.createDummy({ name: crypto.randomUUID() });
  const dummyMessage = newDummy.map((dummy) => dummy.name).join(", ");

  return {
    message: context.cloudflare.env.VALUE_FROM_CLOUDFLARE + ", and dummies: " + dummyMessage,
  };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return <Welcome message={loaderData.message} />;
}

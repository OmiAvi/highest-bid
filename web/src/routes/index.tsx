import { createFileRoute } from "@tanstack/react-router";
import { LobbyPage } from "../pages/LobbyPage";

export const Route = createFileRoute("/")({
  ssr: false,
  component: LobbyPage,
});

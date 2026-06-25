import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter, createHashHistory, createRoute, createRootRoute, Outlet } from "@tanstack/react-router";
import "./index.css";
import { LobbyPage } from "./pages/LobbyPage";
import { GamePage } from "./pages/GamePage";
import { ResultsPage } from "./pages/ResultsPage";

const rootRoute = createRootRoute({ component: () => <Outlet /> });

const lobbyRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: LobbyPage });
const gameRoute = createRoute({ getParentRoute: () => rootRoute, path: "/game/$gameId", component: GamePage });
const resultsRoute = createRoute({ getParentRoute: () => rootRoute, path: "/results/$gameId", component: ResultsPage });

const routeTree = rootRoute.addChildren([lobbyRoute, gameRoute, resultsRoute]);

const router = createRouter({
  routeTree,
  history: createHashHistory(),
});

declare module "@tanstack/react-router" {
  interface Register { router: typeof router; }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

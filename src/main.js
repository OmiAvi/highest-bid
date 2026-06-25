import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter, createHashHistory, createRoute, createRootRoute, Outlet } from "@tanstack/react-router";
import "./index.css";
import { LobbyPage } from "./pages/LobbyPage";
import { GamePage } from "./pages/GamePage";
import { ResultsPage } from "./pages/ResultsPage";
const rootRoute = createRootRoute({ component: () => _jsx(Outlet, {}) });
const lobbyRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: LobbyPage });
const gameRoute = createRoute({ getParentRoute: () => rootRoute, path: "/game/$gameId", component: GamePage });
const resultsRoute = createRoute({ getParentRoute: () => rootRoute, path: "/results/$gameId", component: ResultsPage });
const routeTree = rootRoute.addChildren([lobbyRoute, gameRoute, resultsRoute]);
const router = createRouter({
    routeTree,
    history: createHashHistory(),
});
ReactDOM.createRoot(document.getElementById("root")).render(_jsx(React.StrictMode, { children: _jsx(RouterProvider, { router: router }) }));

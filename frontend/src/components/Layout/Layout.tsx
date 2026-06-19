import { Suspense, useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { api } from "../../api/client";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import type { SettingsData } from "../../types";
import styles from "./Layout.module.css";

const navGroups = [
  {
    label: "General",
    items: [
      { to: "/", label: "Dashboard" },
      { to: "/budgets", label: "Presupuestos" },
      { to: "/work-orders", label: "Órdenes" },
      { to: "/clients", label: "Clientes" },
    ],
  },
  {
    label: "Inventario",
    items: [
      { to: "/materials", label: "Materiales" },
      { to: "/pool-stock", label: "Piletas" },
    ],
  },
  {
    label: "Operaciones",
    items: [
      { to: "/measurements", label: "Mediciones" },
      { to: "/online-budgets", label: "Online" },
      { to: "/calculator", label: "Calculadora" },
    ],
  },
  {
    label: "Administración",
    items: [
      { to: "/reports", label: "Reportes" },
      { to: "/settings", label: "Config" },
    ],
  },
];

export function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    api.getSettings().then(setSettings).catch(() => setSettings(null));
  }, []);

  const hasLogo = settings?.company_logo && !logoError;

  return (
    <div className={styles.layout}>
      <aside className={`${styles.layout__sidebar} ${collapsed ? styles["layout__sidebar--collapsed"] : ""}`}>
        <div className={styles.layout__header}>
          {collapsed ? (
            <h1 className={styles.layout__logoSmall}>A</h1>
          ) : hasLogo ? (
            <img
              className={styles.layout__logoImg}
              src={settings!.company_logo}
              alt="Logo"
              onError={() => setLogoError(true)}
            />
          ) : (
            <h1 className={styles.layout__logo}>{settings?.company_name || "AFAMAR"}</h1>
          )}
          <button
            type="button"
            className={styles.layout__toggle}
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "Expandir" : "Colapsar"}
          >
            {collapsed ? ">" : "<"}
          </button>
        </div>

        <nav className={styles.layout__nav}>
          {navGroups.map((group) => (
            <div key={group.label} className={styles.layout__navGroup}>
              {!collapsed && <span className={styles.layout__navGroupLabel}>{group.label}</span>}
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `${styles.layout__link} ${isActive ? styles["layout__link--active"] : ""}`
                  }
                >
                  {collapsed ? item.label.slice(0, 2) : item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>
      <main className={styles.layout__content}>
        <Suspense fallback={<LoadingSpinner />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}

import { NavLink, Outlet } from "react-router-dom";
import styles from "./Layout.module.css";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/budgets", label: "Presupuestos" },
  { to: "/work-orders", label: "Órdenes" },
  { to: "/clients", label: "Clientes" },
  { to: "/materials", label: "Materiales" },
  { to: "/pool-stock", label: "Stock" },
  { to: "/reports", label: "Reportes" },
  { to: "/settings", label: "Config" },
];

export function Layout() {
  return (
    <div className={styles.layout}>
      <aside className={styles.layout__sidebar}>
        <h1 className={styles.layout__logo}>AFAMAR</h1>
        <nav className={styles.layout__nav}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `${styles.layout__link} ${isActive ? styles["layout__link--active"] : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className={styles.layout__content}>
        <Outlet />
      </main>
    </div>
  );
}

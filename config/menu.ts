import { routes } from "@/routes";
import {
  LayoutDashboard,
  ShoppingBasket,
  PackageSearch,
  Scissors,
  Boxes,
  Receipt,
  PanelsTopLeft,
  BarChart3,
  Settings,
  Store,
  LogIn,
  UserPlus,
  KeyRound,
  ShieldCheck,
} from "lucide-react";

export type MenuItem = {
  key: string;        // english
  label: string;      // bahasa indonesia
  href?: string;
  icon?: any;
  children?: MenuItem[];
};

export const menuTree: MenuItem[] = [
  { key: "dashboard", label: "Dasbor", href: "/", icon: LayoutDashboard },

  {
    key: "productsGroup",
    label: "Produk",
    icon: Boxes,
    children: [
      { key: "procurement", label: "Pembelian Langsung", href: routes.procurement, icon: ShoppingBasket },
      { key: "ball",        label: "Ball",                href: routes.ball,        icon: PackageSearch },
      { key: "sorting",     label: "Sortir",              href: routes.sorting,     icon: Scissors },
      { key: "products",    label: "Produk",              href: routes.products,    icon: Boxes },
    ],
  },

  { key: "transactions", label: "Transaksi", href: routes.sales,    icon: Receipt },
  { key: "channels",     label: "Channel",   href: routes.channels, icon: PanelsTopLeft },
  { key: "reports",      label: "Laporan",   href: routes.reports,  icon: BarChart3 },

  {
    key: "settings",
    label: "Pengaturan",
    icon: Settings,
    children: [
      { key: "stores",       label: "Toko",        href: routes.stores,   icon: Store },
      { key: "settingsMain", label: "Pengaturan",  href: routes.settings, icon: Settings },
    ],
  },

  {
    key: "admin",
    label: "Admin",
    icon: ShieldCheck,
    children: [
      { key: "adminUsers", label: "Staff", href: routes.adminUsers, icon: UserPlus },
    ],
  },

  {
    key: "account",
    label: "Akun",
    icon: KeyRound,
    children: [
      { key: "accountPassword",     label: "Ubah Password",  href: routes.accountPassword,      icon: KeyRound },
      { key: "recoveryCodes",       label: "Recovery Codes", href: routes.accountRecoveryCodes, icon: KeyRound },
      { key: "recoveryReset",       label: "Recovery Reset", href: routes.accountRecoveryReset, icon: KeyRound },
      { key: "forgotPasswordToken", label: "Forgot (Token)", href: routes.accountForgot,        icon: KeyRound },
    ],
  },
];

export const publicMenu: MenuItem[] = [
  { key: "dashboard", label: "Dasbor", href: "/",      icon: LayoutDashboard },
  { key: "login",     label: "Login",  href: "/login", icon: LogIn },
];

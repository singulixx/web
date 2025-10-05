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
  KeyRound,
  ShieldCheck,
  SlidersHorizontal ,
  Users as UsersIcon,
} from "lucide-react";

export type MenuItem = {
  key: string; // english
  label: string; // bahasa indonesia
  href?: string;
  icon?: any;
  children?: MenuItem[];
};

export const menuTree: MenuItem[] = [
  { key: "dashboard", label: "Dasbor", href: "/", icon: LayoutDashboard },

  {
    key: "productsGroup",
    label: "Produk",
    icon: Boxes, // ikon parent
    children: [
      {
        key: "procurement",
        label: "Pembelian Langsung",
        href: routes.procurement,
        icon: ShoppingBasket,
      },
      { key: "ball", label: "Ball", href: routes.ball, icon: PackageSearch },
      { key: "sorting", label: "Sortir", href: routes.sorting, icon: Scissors },
      { key: "products", label: "Produk", href: routes.products, icon: Boxes },
    ],
  },

  {
    key: "transactions",
    label: "Transaksi",
    href: routes.sales,
    icon: Receipt,
  },
  {
    key: "channels",
    label: "Channel",
    href: routes.channels,
    icon: PanelsTopLeft,
  },
  { key: "reports", label: "Laporan", href: routes.reports, icon: BarChart3 },

  {
    key: "settings",
    label: "Pengaturan",
    icon: Settings,
    children: [
      { key: "stores", label: "Toko", href: routes.stores, icon: Store },
      {
        key: "settingsMain",
        label: "Preferensi",
        href: routes.settings,
        icon: SlidersHorizontal,
      },
      {
        key: "accountPassword",
        label: "Ganti Password",
        href: "/account/password",
        icon: KeyRound,
      },
      {
        key: "accountRecovery",
        label: "Recovery Codes",
        href: "/account/recovery-codes",
        icon: ShieldCheck,
      },
      {
        key: "users",
        label: "Pengguna / Staff",
        href: "/settings/users",
        icon: UsersIcon,
      },
    ],
  },
];

export const publicMenu: MenuItem[] = [
  { key: "dashboard", label: "Dasbor", href: "/", icon: LayoutDashboard },
  { key: "login", label: "Login", href: "/login", icon: LogIn },
];

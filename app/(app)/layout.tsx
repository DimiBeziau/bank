import { Nav } from "@/components/nav/Nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main className="mx-auto min-h-dvh max-w-5xl px-4 pt-6 pb-28 md:pt-10 md:pb-10 md:pl-72">
        {children}
      </main>
    </>
  );
}

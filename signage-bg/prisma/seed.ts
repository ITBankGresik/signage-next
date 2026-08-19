import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@bankgresik.co.id" },
    update: {},
    create: {
      email: "admin@bankgresik.co.id",
      name: "Administrator",
      role: "ADMIN",
      passwordHash,
    },
  });

  const layouts = [
    {
      name: "Fullscreen",
      isDefault: true,
      zones: {
        zones: [
          { id: "main", type: "main", position: "full" },
          { id: "ticker", type: "ticker", position: "bottom", height: "40px" },
        ],
      },
    },
    {
      name: "L-Shape",
      isDefault: false,
      zones: {
        zones: [
          { id: "main", type: "main", position: "left", width: "1fr" },
          { id: "sidebar", type: "sidebar", position: "right", width: "220px" },
          { id: "ticker", type: "ticker", position: "bottom", height: "40px" },
        ],
      },
    },
    {
      name: "Split Horizontal",
      isDefault: false,
      zones: {
        zones: [
          { id: "main", type: "main", position: "top", height: "60%" },
          { id: "sidebar", type: "sidebar", position: "bottom", height: "40%" },
          { id: "ticker", type: "ticker", position: "bottom", height: "40px" },
        ],
      },
    },
    {
      name: "Split Vertical",
      isDefault: false,
      zones: {
        zones: [
          { id: "main", type: "main", position: "left", width: "60%" },
          { id: "sidebar", type: "sidebar", position: "right", width: "40%" },
          { id: "ticker", type: "ticker", position: "bottom", height: "40px" },
        ],
      },
    },
  ];

  const createdLayouts = [];
  for (const layout of layouts) {
    const created = await prisma.layout.upsert({
      where: { id: layout.name.toLowerCase().replace(/\s+/g, "-") },
      update: {},
      create: {
        id: layout.name.toLowerCase().replace(/\s+/g, "-"),
        name: layout.name,
        isDefault: layout.isDefault,
        zones: layout.zones,
      },
    });
    createdLayouts.push(created);
  }

  const tickers = [
    { text: "Selamat datang di BPR Bank Gresik", speed: 60, color: "#FFFFFF", order: 0 },
    { text: "Jam layanan: Senin - Jumat, 08:00 - 15:00 WIB", speed: 60, color: "#FFFFFF", order: 1 },
    { text: "Info suku bunga terbaru dapat dilihat di customer service", speed: 60, color: "#FFFFFF", order: 2 },
  ];

  for (const ticker of tickers) {
    const existing = await prisma.ticker.findFirst({ where: { text: ticker.text } });
    if (!existing) {
      await prisma.ticker.create({ data: { ...ticker, isActive: true } });
    }
  }

  console.log("Seed selesai:", { admin: admin.email, layouts: createdLayouts.length });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import type { APIRoute } from "astro";
import { getAuthUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { json } from "@/lib/http";

export const GET: APIRoute = async ({ cookies }) => {
  if (!getAuthUser(cookies)) {
    return json({ error: "Unauthorized" }, 401);
  }

  const [
    skills,
    projects,
    experiences,
    certificates,
    journeyPhotos,
    social,
    messages,
    unreadMessages,
    users,
  ] = await Promise.all([
    prisma.skill.count(),
    prisma.project.count(),
    prisma.experience.count(),
    prisma.certificate.count(),
    prisma.journeyPhoto.count(),
    prisma.socialLink.count(),
    prisma.contactMessage.count(),
    prisma.contactMessage.count({ where: { read: false } }),
    prisma.adminUser.count(),
  ]);

  const recentMessages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return json({
    counts: {
      skills,
      projects,
      experiences,
      certificates,
      journeyPhotos,
      social,
      messages,
      unreadMessages,
      users,
    },
    recentMessages,
  });
};

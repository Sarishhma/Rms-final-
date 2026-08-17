import { prisma } from "../../../../prisma/client.js";
import { ReportFilters } from "../../domain/report.types.js";
import { auditSql } from "../sql/audit.sql.js";

export const auditRiskRepo = {
  summary: async (f: ReportFilters) => {
    return prisma.$queryRaw<Array<{
      total_actions: number;
      unique_actors: number;
      unique_entities: number;
    }>>(auditSql.summary(f));
  },

  byPeriod: async (f: ReportFilters) => {
    return prisma.$queryRaw<Array<{
      period: Date;
      count: number;
    }>>(auditSql.byPeriod(f));
  },

  byHour: async (f: ReportFilters) => {
    return prisma.$queryRaw<Array<{
      date: Date;
      hour: number;
      count: number;
    }>>(auditSql.byHour(f));
  },

  byAction: async (f: ReportFilters) => {
    return prisma.$queryRaw<Array<{
      action: string;
      count: number;
    }>>(auditSql.byAction(f));
  },

  byEntity: async (f: ReportFilters) => {
    return prisma.$queryRaw<Array<{
      entity: string;
      count: number;
    }>>(auditSql.byEntity(f));
  },

  byStaff: async (f: ReportFilters) => {
    return prisma.$queryRaw<Array<{
      staff_id: string;
      staff_name: string | null;
      count: number;
    }>>(auditSql.byStaff(f));
  }
};

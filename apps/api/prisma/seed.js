"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seeding...');
    // Clean existing data
    await prisma.task.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});
    const passwordHash = await bcryptjs_1.default.hash('Password123!', 10);
    // 1. Create primary Demo User
    const demoUser = await prisma.user.create({
        data: {
            email: 'demo@example.com',
            fullName: 'Alex Rivera',
            passwordHash,
        },
    });
    // 2. Create second user to verify cross-user isolation
    const otherUser = await prisma.user.create({
        data: {
            email: 'sarah@example.com',
            fullName: 'Sarah Chen',
            passwordHash,
        },
    });
    const now = new Date();
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    const twentyDaysLater = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);
    const twoDaysLater = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    // Projects for demoUser
    const project1 = await prisma.project.create({
        data: {
            userId: demoUser.id,
            name: 'Mobile Application Launch',
            description: 'End-to-end delivery of the Android & iOS mobile experience.',
            status: 'IN_PROGRESS',
            startDate: fiveDaysAgo,
            endDate: twentyDaysLater,
        },
    });
    const project2 = await prisma.project.create({
        data: {
            userId: demoUser.id,
            name: 'Brand Redesign & Marketing',
            description: 'Revamping visual identity, design guidelines, and typography.',
            status: 'NOT_STARTED',
            startDate: twoDaysLater,
            endDate: thirtyDaysLater,
        },
    });
    const project3 = await prisma.project.create({
        data: {
            userId: demoUser.id,
            name: 'Internal Analytics Dashboard',
            description: 'Executive KPI reporting system with real-time aggregates.',
            status: 'COMPLETED',
            startDate: thirtyDaysAgo,
            endDate: fiveDaysAgo,
        },
    });
    // Tasks for project1
    await prisma.task.createMany({
        data: [
            {
                projectId: project1.id,
                userId: demoUser.id,
                name: 'Design onboarding flow',
                description: 'Wireframes and high-fidelity prototype in Figma',
                priority: 'HIGH',
                status: 'COMPLETED',
                dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            },
            {
                projectId: project1.id,
                userId: demoUser.id,
                name: 'Implement JWT authentication with SecureStore',
                description: 'Protect tokens in Android Keystore / iOS Keychain',
                priority: 'HIGH',
                status: 'IN_PROGRESS',
                dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            },
            {
                projectId: project1.id,
                userId: demoUser.id,
                name: 'Configure pull-to-refresh & offline banner',
                description: 'Add NetInfo listeners for smooth connectivity loss handling',
                priority: 'MEDIUM',
                status: 'PENDING',
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
            {
                projectId: project1.id,
                userId: demoUser.id,
                name: 'Build release APK via EAS',
                description: 'Produce standalone Android APK build artifact',
                priority: 'LOW',
                status: 'PENDING',
                dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
            },
        ],
    });
    // Tasks for project2
    await prisma.task.createMany({
        data: [
            {
                projectId: project2.id,
                userId: demoUser.id,
                name: 'Collect brand moodboards',
                description: 'Gather competitor color palettes and typography inspirations',
                priority: 'MEDIUM',
                status: 'PENDING',
                dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            },
            {
                projectId: project2.id,
                userId: demoUser.id,
                name: 'Finalize vector logo variants',
                description: 'Export SVG and high-res assets for dark/light themes',
                priority: 'HIGH',
                status: 'PENDING',
                dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
            },
        ],
    });
    // Tasks for project3
    await prisma.task.createMany({
        data: [
            {
                projectId: project3.id,
                userId: demoUser.id,
                name: 'Setup PostgreSQL schema & migrations',
                description: 'Foreign key cascades, indexes, and normalized tables',
                priority: 'HIGH',
                status: 'COMPLETED',
                dueDate: thirtyDaysAgo,
            },
            {
                projectId: project3.id,
                userId: demoUser.id,
                name: 'Build aggregation endpoints',
                description: 'Express controller for /api/dashboard metrics',
                priority: 'MEDIUM',
                status: 'COMPLETED',
                dueDate: fiveDaysAgo,
            },
        ],
    });
    // Project & task for otherUser (Sarah)
    const sarahProject = await prisma.project.create({
        data: {
            userId: otherUser.id,
            name: 'Confidential Security Audit 2026',
            description: 'Private penetration testing and isolation audit.',
            status: 'IN_PROGRESS',
            startDate: fiveDaysAgo,
            endDate: twentyDaysLater,
        },
    });
    await prisma.task.create({
        data: {
            projectId: sarahProject.id,
            userId: otherUser.id,
            name: 'Audit cross-user query boundaries',
            description: 'Ensure User A receives 404 for User B items',
            priority: 'HIGH',
            status: 'IN_PROGRESS',
            dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        },
    });
    console.log('✅ Seeding completed successfully!');
    console.log('----------------------------------------------------');
    console.log('Demo Credentials:');
    console.log('  Email:    demo@example.com');
    console.log('  Password: Password123!');
    console.log('');
    console.log('Secondary User (For Isolation Checks):');
    console.log('  Email:    sarah@example.com');
    console.log('  Password: Password123!');
    console.log('----------------------------------------------------');
}
main()
    .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map
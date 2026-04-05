"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.teacherPerformanceScore = teacherPerformanceScore;
exports.simulateStudentInsights = simulateStudentInsights;
function teacherPerformanceScore(input) {
    const attendanceScore = Math.min(input.totalAttendanceMarked / Math.max(input.totalClassesAssigned, 1), 1) * 100;
    const completionScore = input.classCompletionRate * 100;
    const feedbackScore = (input.avgFeedback / 5) * 100;
    const score = attendanceScore * 0.35 + completionScore * 0.35 + feedbackScore * 0.3;
    return {
        attendanceScore: Number(attendanceScore.toFixed(2)),
        completionScore: Number(completionScore.toFixed(2)),
        feedbackScore: Number(feedbackScore.toFixed(2)),
        totalScore: Number(score.toFixed(2)),
    };
}
function simulateStudentInsights(attendanceRecords, marks) {
    const attendanceRatio = attendanceRecords.length === 0
        ? 0
        : attendanceRecords.filter((entry) => entry.status === "present").length / attendanceRecords.length;
    const marksTrend = marks.length
        ? marks.reduce((acc, mark) => acc + (mark.score / mark.maxScore) * 100, 0) / marks.length
        : 0;
    const blended = attendanceRatio * 40 + (marksTrend / 100) * 60;
    let label = "At risk";
    let recommendation = "Immediate support needed. Schedule remedial sessions.";
    if (blended >= 80) {
        label = "Excellent";
        recommendation = "Maintain momentum. Provide advanced assignments.";
    }
    else if (blended >= 55) {
        label = "Needs improvement";
        recommendation = "Target low-scoring subjects and improve attendance consistency.";
    }
    return {
        attendanceRatio: Number((attendanceRatio * 100).toFixed(2)),
        marksTrend: Number(marksTrend.toFixed(2)),
        predictionLabel: label,
        recommendation,
    };
}

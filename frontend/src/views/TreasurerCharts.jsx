import React from 'react';
import { Card } from '../components/ui';

const TreasurerCharts = ({ transactions, categories }) => {

    // 1. Calculate Income vs Expense
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const maxVal = Math.max(income, expense, 1); // Avoid div by 0

    const incomeHeight = (income / maxVal) * 100;
    const expenseHeight = (expense / maxVal) * 100;

    // 2. Calculate Expenses by Category
    const expensesByCategory = {};
    transactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
        });

    const expenseCategories = Object.keys(expensesByCategory).map(cat => ({
        name: cat,
        amount: expensesByCategory[cat],
        percentage: (expensesByCategory[cat] / (expense || 1)) * 100
    })).sort((a, b) => b.amount - a.amount); // Sort desc

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
            {/* Chart 1: Income vs Expense Bar Chart */}
            <Card className="p-6">
                <h3 className="font-bold text-gray-900 mb-6">Balance General</h3>
                <div className="flex justify-center items-end h-48 gap-8 px-8">
                    {/* Income Bar */}
                    <div className="flex flex-col items-center group w-20">
                        <div className="relative w-full bg-gray-100 rounded-t-lg overflow-hidden h-40 flex items-end">
                            <div
                                className="w-full bg-green-500 rounded-t-lg transition-all duration-1000 group-hover:bg-green-400"
                                style={{ height: `${incomeHeight}%` }}
                            ></div>
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                S/ {income.toFixed(2)}
                            </div>
                        </div>
                        <span className="mt-2 text-sm font-medium text-gray-600">Ingresos</span>
                    </div>

                    {/* Expense Bar */}
                    <div className="flex flex-col items-center group w-20">
                        <div className="relative w-full bg-gray-100 rounded-t-lg overflow-hidden h-40 flex items-end">
                            <div
                                className="w-full bg-red-500 rounded-t-lg transition-all duration-1000 group-hover:bg-red-400"
                                style={{ height: `${expenseHeight}%` }}
                            ></div>
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                S/ {expense.toFixed(2)}
                            </div>
                        </div>
                        <span className="mt-2 text-sm font-medium text-gray-600">Egresos</span>
                    </div>
                </div>
            </Card>

            {/* Chart 2: Expense Distribution */}
            <Card className="p-6">
                <h3 className="font-bold text-gray-900 mb-4">Distribución de Gastos</h3>
                {expenseCategories.length > 0 ? (
                    <div className="space-y-3">
                        {expenseCategories.map((cat, idx) => (
                            <div key={idx} className="group">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-700 font-medium">{cat.name}</span>
                                    <span className="text-gray-500">S/ {cat.amount.toFixed(2)} ({cat.percentage.toFixed(1)}%)</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2.5">
                                    <div
                                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-1000"
                                        style={{ width: `${cat.percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                        No hay gastos registrados
                    </div>
                )}
            </Card>
        </div>
    );
};

export default TreasurerCharts;

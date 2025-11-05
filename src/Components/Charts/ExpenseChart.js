import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import axios from 'axios';
import './ExpenseChart.css';

const ExpenseChart = () => {
  const svgRef = useRef();
  const [data, setData] = useState([]);
  const [chartType, setChartType] = useState('bar');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const chartTypes = [
    { value: 'bar', label: '📊 Bar Chart', description: 'Compare categories side by side' },
    { value: 'pie', label: '🥧 Pie Chart', description: 'Show proportion of total expenses' },
    { value: 'donut', label: '🍩 Donut Chart', description: 'Modern pie chart with center space' },
    { value: 'line', label: '📈 Line Chart', description: 'Show trends over categories' },
    { value: 'area', label: '📉 Area Chart', description: 'Filled line chart for emphasis' },
    { value: 'horizontal', label: '📋 Horizontal Bar', description: 'Better for long category names' },
    { value: 'column', label: '📏 Column Chart', description: 'Vertical bars with spacing' },
    { value: 'scatter', label: '🔵 Scatter Plot', description: 'Show data points distribution' }
  ];

  // Get user ID from localStorage
  const getUserId = () => {
    const userData = JSON.parse(localStorage.getItem('userData'));
    return userData?.uuid;
  };

  // Fetch expense data by category
  const fetchExpenseData = async () => {
    try {
      setLoading(true);
      setError(null);
      const userId = getUserId();
      if (!userId) return;

      const response = await axios.get(`${process.env.REACT_APP_BACKEND_BASE_URL}/transaction-tracker/transactions/${userId}`, {
        params: { limit: 1000 } // Get all transactions
      });

      if (response.data.success) {
        const transactions = response.data.data;
        
        // Filter only expenses and group by category
        const expenses = transactions.filter(t => t.type === 'Expense');
        const categoryData = expenses.reduce((acc, transaction) => {
          const category = transaction.category;
          if (acc[category]) {
            acc[category] += transaction.amount;
          } else {
            acc[category] = transaction.amount;
          }
          return acc;
        }, {});

        // Convert to array format for D3
        const chartData = Object.entries(categoryData).map(([category, amount]) => ({
          category,
          amount,
          formattedAmount: `₹${amount.toLocaleString('en-IN')}`
        }));

        // Sort by amount descending
        chartData.sort((a, b) => b.amount - a.amount);
        
        setData(chartData);
      }
    } catch (err) {
      setError('Error fetching expense data');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenseData();
  }, []);

  useEffect(() => {
    if (data.length > 0 && !loading) {
      drawChart();
    }
  }, [data, chartType]);

  const drawChart = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous chart

    if (data.length === 0) return;

    const margin = { top: 40, right: 80, bottom: 80, left: 80 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const g = svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Color scale
    const colorScale = d3.scaleOrdinal()
      .domain(data.map(d => d.category))
      .range(['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F']);

    switch (chartType) {
      case 'bar':
        drawBarChart(g, width, height, colorScale);
        break;
      case 'pie':
        drawPieChart(g, width, height, colorScale);
        break;
      case 'donut':
        drawDonutChart(g, width, height, colorScale);
        break;
      case 'line':
        drawLineChart(g, width, height, colorScale);
        break;
      case 'area':
        drawAreaChart(g, width, height, colorScale);
        break;
      case 'horizontal':
        drawHorizontalBarChart(g, width, height, colorScale);
        break;
      case 'column':
        drawColumnChart(g, width, height, colorScale);
        break;
      case 'scatter':
        drawScatterPlot(g, width, height, colorScale);
        break;
      default:
        drawBarChart(g, width, height, colorScale);
    }
  };

  const drawBarChart = (g, width, height, colorScale) => {
    const xScale = d3.scaleBand()
      .domain(data.map(d => d.category))
      .range([0, width])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.amount)])
      .nice()
      .range([height, 0]);

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)');

    g.append('g')
      .call(d3.axisLeft(yScale));

    // Add bars with animation
    g.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.category))
      .attr('width', xScale.bandwidth())
      .attr('fill', d => colorScale(d.category))
      .attr('y', height)
      .attr('height', 0)
      .transition()
      .duration(800)
      .attr('y', d => yScale(d.amount))
      .attr('height', d => height - yScale(d.amount));

    // Add value labels
    g.selectAll('.label')
      .data(data)
      .enter().append('text')
      .attr('class', 'label')
      .attr('x', d => xScale(d.category) + xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.amount) - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#333')
      .text(d => d.formattedAmount);

    addAxesLabels(g, width, height, 'Categories', 'Amount (₹)');
  };

  const drawPieChart = (g, width, height, colorScale) => {
    const radius = Math.min(width, height) / 2;
    const pie = d3.pie().value(d => d.amount);
    const arc = d3.arc().innerRadius(0).outerRadius(radius - 10);

    g.attr('transform', `translate(${width / 2},${height / 2})`);

    const slices = g.selectAll('.slice')
      .data(pie(data))
      .enter().append('g')
      .attr('class', 'slice');

    slices.append('path')
      .attr('fill', d => colorScale(d.data.category))
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .transition()
      .duration(800)
      .attrTween('d', function(d) {
        const interpolate = d3.interpolate({startAngle: 0, endAngle: 0}, d);
        return function(t) { return arc(interpolate(t)); };
      });

    // Add labels
    slices.append('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', 'white')
      .style('font-weight', 'bold')
      .text(d => d.data.category);

    addLegend(g, data, colorScale, width, height);
  };

  const drawDonutChart = (g, width, height, colorScale) => {
    const radius = Math.min(width, height) / 2;
    const pie = d3.pie().value(d => d.amount);
    const arc = d3.arc().innerRadius(radius * 0.4).outerRadius(radius - 10);

    g.attr('transform', `translate(${width / 2},${height / 2})`);

    const slices = g.selectAll('.slice')
      .data(pie(data))
      .enter().append('g')
      .attr('class', 'slice');

    slices.append('path')
      .attr('fill', d => colorScale(d.data.category))
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .transition()
      .duration(800)
      .attrTween('d', function(d) {
        const interpolate = d3.interpolate({startAngle: 0, endAngle: 0}, d);
        return function(t) { return arc(interpolate(t)); };
      });

    // Center text
    const totalAmount = data.reduce((sum, d) => sum + d.amount, 0);
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', -10)
      .style('font-size', '24px')
      .style('font-weight', 'bold')
      .style('fill', '#333')
      .text('Total');

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 20)
      .style('font-size', '18px')
      .style('fill', '#666')
      .text(`₹${totalAmount.toLocaleString('en-IN')}`);

    addLegend(g, data, colorScale, width, height);
  };

  const drawLineChart = (g, width, height, colorScale) => {
    const xScale = d3.scaleBand()
      .domain(data.map(d => d.category))
      .range([0, width])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.amount)])
      .nice()
      .range([height, 0]);

    const line = d3.line()
      .x(d => xScale(d.category) + xScale.bandwidth() / 2)
      .y(d => yScale(d.amount))
      .curve(d3.curveMonotoneX);

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    g.append('g')
      .call(d3.axisLeft(yScale));

    // Add line
    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#4ECDC4')
      .attr('stroke-width', 3)
      .attr('d', line);

    // Add points
    g.selectAll('.point')
      .data(data)
      .enter().append('circle')
      .attr('class', 'point')
      .attr('cx', d => xScale(d.category) + xScale.bandwidth() / 2)
      .attr('cy', d => yScale(d.amount))
      .attr('r', 5)
      .attr('fill', d => colorScale(d.category));

    addAxesLabels(g, width, height, 'Categories', 'Amount (₹)');
  };

  const drawAreaChart = (g, width, height, colorScale) => {
    const xScale = d3.scaleBand()
      .domain(data.map(d => d.category))
      .range([0, width])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.amount)])
      .nice()
      .range([height, 0]);

    const area = d3.area()
      .x(d => xScale(d.category) + xScale.bandwidth() / 2)
      .y0(height)
      .y1(d => yScale(d.amount))
      .curve(d3.curveMonotoneX);

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    g.append('g')
      .call(d3.axisLeft(yScale));

    // Add area
    g.append('path')
      .datum(data)
      .attr('fill', 'url(#areaGradient)')
      .attr('d', area);

    // Add gradient definition
    const defs = g.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'areaGradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0).attr('y1', height)
      .attr('x2', 0).attr('y2', 0);

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#4ECDC4')
      .attr('stop-opacity', 0.1);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#4ECDC4')
      .attr('stop-opacity', 0.8);

    addAxesLabels(g, width, height, 'Categories', 'Amount (₹)');
  };

  const drawHorizontalBarChart = (g, width, height, colorScale) => {
    const xScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.amount)])
      .nice()
      .range([0, width]);

    const yScale = d3.scaleBand()
      .domain(data.map(d => d.category))
      .range([0, height])
      .padding(0.1);

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    g.append('g')
      .call(d3.axisLeft(yScale));

    // Add bars
    g.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('y', d => yScale(d.category))
      .attr('height', yScale.bandwidth())
      .attr('fill', d => colorScale(d.category))
      .attr('x', 0)
      .attr('width', 0)
      .transition()
      .duration(800)
      .attr('width', d => xScale(d.amount));

    addAxesLabels(g, width, height, 'Amount (₹)', 'Categories');
  };

  const drawColumnChart = (g, width, height, colorScale) => {
    // Similar to bar chart but with more spacing
    drawBarChart(g, width, height, colorScale);
  };

  const drawScatterPlot = (g, width, height, colorScale) => {
    const xScale = d3.scaleBand()
      .domain(data.map(d => d.category))
      .range([0, width])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.amount)])
      .nice()
      .range([height, 0]);

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    g.append('g')
      .call(d3.axisLeft(yScale));

    // Add circles
    g.selectAll('.circle')
      .data(data)
      .enter().append('circle')
      .attr('class', 'circle')
      .attr('cx', d => xScale(d.category) + xScale.bandwidth() / 2)
      .attr('cy', d => yScale(d.amount))
      .attr('r', 0)
      .attr('fill', d => colorScale(d.category))
      .transition()
      .duration(800)
      .attr('r', 8);

    addAxesLabels(g, width, height, 'Categories', 'Amount (₹)');
  };

  const addAxesLabels = (g, width, height, xLabel, yLabel) => {
    // X-axis label
    g.append('text')
      .attr('transform', `translate(${width / 2}, ${height + 50})`)
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#666')
      .text(xLabel);

    // Y-axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - 50)
      .attr('x', 0 - (height / 2))
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#666')
      .text(yLabel);
  };

  const addLegend = (g, data, colorScale, width, height) => {
    const legend = g.selectAll('.legend')
      .data(data)
      .enter().append('g')
      .attr('class', 'legend')
      .attr('transform', (d, i) => `translate(${width / 2 + 50}, ${-height / 2 + i * 25})`);

    legend.append('rect')
      .attr('width', 18)
      .attr('height', 18)
      .style('fill', d => colorScale(d.category));

    legend.append('text')
      .attr('x', 25)
      .attr('y', 9)
      .attr('dy', '.35em')
      .style('text-anchor', 'start')
      .style('font-size', '12px')
      .text(d => `${d.category}: ${d.formattedAmount}`);
  };

  if (loading) {
    return (
      <div className="chart-loading">
        <div className="loading-spinner"></div>
        <p>Loading expense data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chart-error">
        <p>❌ {error}</p>
        <button onClick={fetchExpenseData} className="retry-btn">
          🔄 Retry
        </button>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="chart-no-data">
        <p>📊 No expense data available. Add some transactions to see charts!</p>
      </div>
    );
  }

  return (
    <div className="expense-chart-container">
      <div className="chart-header">
        <h2>📊 Expense Analysis by Category</h2>
        <p>Total Categories: {data.length} | Total Amount: ₹{data.reduce((sum, d) => sum + d.amount, 0).toLocaleString('en-IN')}</p>
      </div>

      <div className="chart-controls">
        <label htmlFor="chartType">Chart Type:</label>
        <select
          id="chartType"
          value={chartType}
          onChange={(e) => setChartType(e.target.value)}
          className="chart-type-select"
        >
          {chartTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        <span className="chart-description">
          {chartTypes.find(t => t.value === chartType)?.description}
        </span>
      </div>

      <div className="chart-wrapper">
        <svg ref={svgRef}></svg>
      </div>

      <div className="chart-info">
        <p>💡 Tip: Switch between different chart types to better understand your spending patterns!</p>
      </div>
    </div>
  );
};

export default ExpenseChart;
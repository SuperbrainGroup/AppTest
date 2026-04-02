// Chart So sánh kết quả giữa các lần test
//loadAndDrawChartsForStudent <-- Call to Using 
function drawBarChartResult(categories, chartData) {
    const chart = echarts.init(document.getElementById("barChartResult"));

    const series = chartData.map(test => ({
        name: `${test.name} (${test.date})`,
        type: 'bar',
        data: test.data
    }));

    const option = {
        title: {
            text: '',
            left: 'center',
            textStyle: {
                fontFamily: '"Nunito Sans", sans-serif',
                fontSize: 16
            }
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            textStyle: {
                fontFamily: '"Nunito Sans", sans-serif',
                fontSize: 13
            }
        },
        legend: {
            top: 'bottom',
            textStyle: {
                fontFamily: '"Nunito Sans", sans-serif',
                fontSize: 13
            }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '10%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: categories,
            axisLabel: {
                fontFamily: '"Nunito Sans", sans-serif',
                fontSize: 13
            }
        },
        yAxis: {
            type: 'value',
            max: 100,
            name: 'Điểm',
            axisLabel: {
                fontFamily: '"Nunito Sans", sans-serif',
                fontSize: 13
            }
        },
        series: series
    };

    chart.setOption(option);
}

// Radar Chart cho 1 lần kiểm tra cuối cùng
// LoadResultTestById <-- Call to Using
function drawRadarChartResult(categories, data) {
    const chart = echarts.init(document.getElementById("radarChartResult"));
    const maxValue = 100;

    const indicator = categories.map(name => ({
        name,
        max: maxValue
    }));

    const option = {
        title: {
            text: '',
            left: 'center'
        },
        tooltip: {
            textStyle: {
                fontFamily: '"Nunito Sans", sans-serif',  // <-- Font bạn muốn
                fontSize: 14,
                color: '#000' // Màu chữ tooltip
            }
        },
        radar: {
            indicator: indicator,
            radius: '60%',
            axisName: {
                color: '#333',
                fontSize: 14,
                fontFamily: '"Nunito Sans", sans-serif'
            }
        },
        series: [{
            name: 'Kết quả đánh giá',
            type: 'radar',
            data: [
                {
                    value: data,
                    name: 'Chi tiết kết quả',
                    areaStyle: {
                        color: 'rgba(15, 171, 75, 0.3)'
                    },
                    lineStyle: {
                        color: 'rgba(15, 171, 75, 1)'
                    },
                    symbol: 'circle',
                    symbolSize: 6,
                    itemStyle: {
                        color: 'rgba(15, 171, 75, 1)'
                    }
                }
            ]
        }]
    };
    chart.setOption(option);
}
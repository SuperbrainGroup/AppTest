async function loadRadarChartData() {
    try {
        const response = await fetch('/GetRadarData');
        const res = await response.json();
        console.log("RadarChart: " + res);
        const categoryNames = res.categories ?? [];
        const chartData = res.chartData ?? [];

        const seriesData = chartData.map((item) => ({
            value: item.data,
            name: item.name
        }));

        const chartDom = document.getElementById('radarChart');
        const myChart = echarts.init(chartDom);

        const option = {
            title: {
                text: '',
                left: 'center'
            },
            tooltip: {},
            legend: {
                data: seriesData.map(x => x.name),
                bottom: 0,
                textStyle: {
                    fontFamily: '"Nunito Sans", sans-serif',
                    fontSize: 12
                }
            },
            radar: {
                indicator: categoryNames.map(name => ({
                    name: name,
                    max: 100
                }))
            },
            series: [{
                name: 'Điểm theo danh mục',
                type: 'radar',
                data: seriesData
            }]
        };

        myChart.setOption(option);
    } catch (err) {
        showNotification("lỗi " + err);
    }
}loadRadarChartData();


async function loadColumnChartData() {
    try {
        const response = await fetch('/GetComparisonData');
        const res = await response.json();
        const categoryNames = res.categories ?? [];
        const data = res.comparisonData[0]; // ✅ lấy dữ liệu đúng

        const chartDom = document.getElementById('columnChart');
        const myChart = echarts.init(chartDom);

        const option = {
            title: {
                text: '',
                left: 'center'
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                }
            },
            legend: {
                data: ['Điểm của bạn', 'Chưa học (Avg)', 'Đã học (Avg)'],
                bottom: 0,
                textStyle: {
                    fontFamily: '"Nunito Sans", sans-serif',
                    fontSize: 12
                }
            },
            xAxis: {
                type: 'category',
                data: categoryNames
            },
            yAxis: {
                type: 'value',
                name: '',
                max: 100
            },
            series: [
                {
                    name: 'Điểm của bạn',
                    type: 'bar',
                    data: data.userData,
                    barGap: 0
                },
                {
                    name: 'Chưa học (Avg)',
                    type: 'bar',
                    data: data.avgDataZero
                },
                {
                    name: 'Đã học (Avg)',
                    type: 'bar',
                    data: data.avgDataOther
                }
            ]
        };

        myChart.setOption(option);
    } catch (err) {
        alert("Lỗi tải dữ liệu.");
    }
}loadColumnChartData();

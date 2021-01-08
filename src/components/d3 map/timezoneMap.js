import React, { Component } from "react";
import * as d3 from 'd3-old';
import './map.css';
import newMapData from './newMapData.json';

class TimeZoneMap extends Component {
    constructor(props) {
        super(props);
        this.state = {
            _isMounted: true,
            svgHeight: 500,
            svgWidth: 1000,
            centers: props.timeZoneMap.map((val) => ({
                x: (180 + parseInt(val.lng)) / 360,
                y: (90 - parseInt(val.lat)) / 180,
                name: val.country,
                timezone: val.timezone
            })),
            lastCenter: {},
            mapAxisX: "",
            mapAxisY: "",
            release: false,
            tempTz: ""
        }
        this.onMouseMove = this.onMouseMove.bind(this);
        this.mapRef = React.createRef();
    }

    componentDidMount() {
        this.setState({ _isMounted: true, selectedTimeZone: this.props.selectedTimeZone || {} });
        this.reRenderMap();
        this.setTooltip(this.props.selectedTimeZone);
        this.setXY(this.props.selectedTimeZone);
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        console.log(nextProps)
        if (nextProps.selectedTimeZone.timezoneId !== this.state.selectedTimeZone.timezoneId) {
            this.setState({ selectedTimeZone: nextProps.selectedTimeZone });
            this.setTooltip(nextProps.selectedTimeZone);
            this.setXY(nextProps.selectedTimeZone);
        }
        this.reRenderMap();
    }

    reRenderMap = () => {
        let el = document.getElementById("Map-container");

        if (el !== null) {
            el.innerHTML = "";
        }

        if (this.props.timeZoneMap) {
            this.renderMap();
        }
    }

    setTooltip = (data) => {
        let message = "Select timezone";
        if (data.timezoneId) {
            message = `${data.countryName} : ${data.timezoneId}`;
        }
        d3.select('.Maptooltip').text(message);
    }

    setXY = (data) => {
        let ind = this.state.centers.findIndex(e => e.timezone === data.timezoneId);
        if (ind !== -1) {
            let closestCenter = this.state.centers[ind];
            this.setState({
                lastCenter: closestCenter,
                mapAxisX: `calc(${closestCenter.x * 100}% + 3px)`,
                mapAxisY: `calc(${closestCenter.y * 100}% + 3px)`
            });
        }
    }

    renderMap = () => {
        const { svgHeight, svgWidth } = this.state;
        const { timeZoneMap, selectedTimeZone } = this.props;

        var projection = d3.geoEquirectangular()
            .rotate([10, 0]);

        // where world split occurs
        var path = d3.geoPath()
            .projection(projection);

        var svg = d3.select("#Map-container").append("svg")
            .attr("viewBox", `0 0  ${svgWidth} ${svgHeight}`)

        var g = svg.append("g");

        // load and display the world and locations
        var topology = newMapData;
        g.selectAll("path")
            .data(topology.features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("id", function (d, i) {
                if (d.properties.sovereignt === selectedTimeZone.countryName) {
                    return "country-on-" + d.properties.sovereignt;
                } else {
                    return "country-" + d.properties.sovereignt;
                }
            })
            .attr("class", function (d, i) {
                if (d.properties.sovereignt === selectedTimeZone.countryName) {
                    return "country selectedCountry"
                } else {
                    return "country"
                }
            })
            .on("mousemove", function (e, d) {
                d3.selectAll(".country").classed("country-on", false);
                d3.select(this).classed("country-on", true);

                d3.selectAll(".timezoneId" + d.properties.sovereignt).style('fill', 1);
                d3.selectAll(".timezoneId" + d.properties.sovereignt).classed("selectPath", true);
            })
            .on("mouseout", (e, d) => {
                d3.selectAll(".country").classed("country-on", false);
                d3.selectAll(".timezone").classed("selectPath", false);
            });

        d3.selectAll(".timezone-on").style('fill-opacity', 1);

        // zoom feature
        const zoom = d3.zoom()
            .scaleExtent([1, 8])
            .translateExtent([[0, 0], [svgWidth, svgHeight]])
            .on("zoom", zoomed);

        function zoomed(event) {
            const { transform } = event;
            g.attr("transform", transform);
            g.attr("stroke-width", 1 / transform.k);
        }

        svg.call(zoom);

        // render timezone dots
        var locations = g.selectAll("circle")
            .data(timeZoneMap)
            .enter()
            .append("circle")
            .attr("cy", function (d) { return projection([d.lng, d.lat])[1]; })
            .attr("r", 3)
            .attr("cx", function (d) { return projection([d.lng, d.lat])[0]; })
            .attr("id", function (d, i) {
                if (d.country === selectedTimeZone.countryName) {
                    return "timezone-on" + d.country;
                } else {
                    return "timezone" + d.country;
                }
            })
            .attr("class", (d, i) => {
                if (d.country === selectedTimeZone.countryName) {
                    if (d.timezone === selectedTimeZone.timezoneId) {
                        return "timezone selectedTimezone timezoneId" + d.country;
                    } else if (d.timezone === this.state.tempTz) {
                        return "timezone timezone-temp timezoneId" + d.country;
                    } else {
                        return "timezone timezone-on timezoneId" + d.country;
                    }
                } else {
                    return "timezone timezoneId" + d.country;
                }
            });

        locations.on("mousemove", function (event, d) {
            d3.select('.Maptooltip').text(`${d.country} : ${d.timezone}`);
            d3.selectAll("#country-" + d.country).classed("country-on", true);
            d3.selectAll(".timezoneId" + d.country).classed("selectPath", true);
        });

        locations.on("mouseout", (i, d) => {
            this.setTooltip(this.props.selectedTimeZone);
            d3.selectAll("#country-" + d.country).classed("country-on", false);
            d3.selectAll(".timezoneId" + d.country).classed("selectPath", false);
        });

        const clickTimezone = (event, data) => {
            if (this.state.tempTz === data.timezone) {
                this.props.setData({ countryName: data.country, timezoneId: data.timezone });
                this.setState({ release: false });
            } else {
                this.setState({ release: true, tempTz: data.timezone });
                this.setXY({ timezoneId: data.timezone });
                d3.select('.timezone').classed('timezone-temp', false);
            }
        };

        locations.on("click", function (event, data) {
            d3.select(this).classed('timezone-temp', true);
            clickTimezone(event, data);
        });
    }

    onMouseMove(e) {
        const rect = this.mapRef.current.getBoundingClientRect();
        const win = this.mapRef.current.ownerDocument.defaultView;
        const offsetTop = rect.top + win.pageYOffset;
        const offsetLeft = rect.left + win.pageXOffset;
        const x = e.pageX - offsetLeft;
        const y = e.pageY - offsetTop;
        const px = x / this.mapRef.current.offsetWidth;
        const py = y / this.mapRef.current.offsetHeight;
        let dist;
        let closestDist = 100;
        let closestCenter;

        const distSqr = (x, y, px, py) => {
            const dx = x - px;
            const dy = y - py;
            return dx * dx + dy * dy;
        }

        this.state.centers.forEach((tz) => {
            dist = distSqr(tz.x, tz.y, px, py);
            if (dist < closestDist) {
                closestCenter = tz;
                closestDist = dist;
            }
        });

        if (closestCenter) {
            const lastCenter = this.state.lastCenter;
            if (closestCenter === lastCenter) {
                return;
            }

            if (!this.props.selectedTimeZone.timezoneId || this.state.release) {
                this.setState({
                    lastCenter: closestCenter,
                    mapAxisX: `calc(${closestCenter.x * 100}% + 3px)`,
                    mapAxisY: `calc(${closestCenter.y * 100}% + 3px)`
                });
            }
        }
    }

    render() {
        return (
            <>
                <div id='mainDivContainer' style={{ position: "relative", width: "100%" }}>
                    <div id="Map-container" ref={this.mapRef} onMouseMove={(e) => this.onMouseMove(e)} />
                    <div className="map-axis-x" style={{ left: this.state.mapAxisX }} />
                    <div className="map-axis-y" style={{ top: this.state.mapAxisY }} />
                </div>
                <div id="Map-container1" >
                    <div className='Maptooltip'></div>
                </div>
            </>
        );
    }
    componentWillUnmount() {
        this.setState({ _isMounted: false })

    }
}

export default TimeZoneMap;

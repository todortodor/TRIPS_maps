window.addEventListener('DOMContentLoaded', async () => {
    const { nodes, edges } = await (await fetch('data/graph.json')).json();
    const elements = [
        ...nodes.map(node => ({ group: 'nodes', data: node, position: { x: node.lng, y: -node.lat } })),
        ...edges.map(edge => ({ group: 'edges', data: edge })),
    ];
    let initial_style = [
        {
            selector: 'node',
            style: {
                'border-color': '#ffffff',
                'border-width': 2,
                'background-color': "mapData(BaselineTFHatColor, 0, 1, red, green)",
                'color': 'white',
                'label': 'data(id)',
                'text-valign': 'center',
                'text-halign': 'center',
                'text-background-opacity': 0,
                'text-background-padding': 4,
                "width": "mapData(BaselineTFValueSize, 0, 1, 80, 200)",
                "height": "mapData(BaselineTFValueSize, 0, 1, 80, 200)",
                'opacity': 1,
                'font-size': "mapData(BaselineTFValueSize, 0, 1, 40, 50)",
                'overlay-opacity': 0,
            }
        },
        {
            selector: 'node:selected',
            style: {
                'border-color': '#ff0000',
                'border-width': 6,
                'border-opacity': 0.5
            }
        },
        {
            selector: 'edge',
            style: {
                'line-color': "mapData(BaselineTFHatColor, 0, 1, red, green)",
                'width': "mapData(BaselineTFValueSize, 0, 1, 0, 20)",
                'curve-style': 'unbundled-bezier',
                // 'opacity': "mapData(BaselineTFValueSize, 0, 1, 0.5, 1)",
                'opacity': 1,
                'target-arrow-shape': 'triangle-backcurve',
                'source-arrow-shape': 'circle',
                'target-arrow-color': "mapData(BaselineTFHatColor, 0, 1, red, green)",
                'source-arrow-color': "mapData(BaselineTFHatColor, 0, 1, red, green)",
                'overlay-opacity': 0,
            }
        },
    ]

    const cy = cytoscape({
        container: document.getElementById('graph'),
        elements,
        layout: {
            name: 'preset',
            zoom: 0,
        },
        style: initial_style,
        // autoungrabify: true,
        // autounselectify: true,
        // motionBlur: true,
    });

    let newLayout = cy.layout({
        name: 'cose',
        animate: true,
        randomize: false,
        numIter: 5000,
        coolingFactor: 0.99,
        gravity: 20,
        initialTemp: 1000,
        minTemp: 1,
        edgeElasticity: function (edge) {
            return (0.5 / Math.max(edge.data().totalShareOutputSource, edge.data().totalShareInputTarget)) ** 4
        },
        nodeOverlap: 1e9,
        animationThreshold: 1,
        refresh: 1,
    })

    cyMap = cy.mapboxgl({
        accessToken: 'pk.eyJ1IjoidG9kb3J0b2RvciIsImEiOiJja3pyNjY3aXcwN2N4MnJ0OWV0dTJ6eHliIn0.SczAOEiQ1VlazE-oYGOFLQ', // cytoscape-mapbox-gl token
        // style: 'mapbox://styles/mapbox/streets-v11'
        style: {
            'version': 8,
            'sources': {
                'raster-tiles': {
                    'type': 'raster',
                    'tiles': ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                    'tileSize': 256,
                }
            },
            'layers': [
                {
                    'id': 'raster-tiles',
                    'type': 'raster',
                    'source': 'raster-tiles',
                    'minzoom': 0,
                    'maxzoom': 19
                }
            ]
        }
    },
        {
            getPosition: (node) => {
                return [node.data('lng'), node.data('lat')];
            },
            setPosition: (node, lngLat) => {
                node.data('lng', lngLat.lng);
                node.data('lat', lngLat.lat);
                console.log(node.id(), lngLat);
            },
            animate: true,
            animationDuration: 1,
        });
    cyMap.map.addControl(new mapboxgl.NavigationControl(), 'top-left');

    const updateBasemap = () => {
        const basemap = document.getElementById('basemap').value;
        if (basemap === 'raster') {
            cyMap.map.setStyle({
                'version': 8,
                'sources': {
                    'raster-tiles': {
                        'type': 'raster',
                        'tiles': ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                        'tileSize': 256,
                    }
                },
                'layers': [
                    {
                        'id': 'raster-tiles',
                        'type': 'raster',
                        'source': 'raster-tiles',
                        'minzoom': 0,
                        'maxzoom': 19
                    }
                ]
            }, { diff: false });
        } else if (basemap === 'vector') {
            cyMap.map.setStyle('mapbox://styles/mapbox/streets-v11', { diff: false });
        }
    }
    document.getElementById('basemap').addEventListener('change', updateBasemap);

    cy.nodes().qtip({
        content: function(){ 
            return `${this.id()} : Gross output = ${this.data()[document.getElementById('State').value + document.getElementById('Flow').value + 'Value']}Mio.
            \$ <br> Gross output change = ${this.data()[document.getElementById('State').value + document.getElementById('Flow').value + 'Hat']}%
            \$ <br> Welfare change = ${this.data()[document.getElementById('State').value + document.getElementById('Flow').value + 'Welfare']}%`
        },
        position: {
            my: 'top center',
            at: 'bottom center'
        },
        style: {
            classes: 'qtip-bootstrap',
            tip: {
                width: 10,
                height: 8
            }
        }
    });

    const switchMapOrNetwork = () => {
        const mapOrNetwork = document.getElementById('mapOrNetwork').value;
        console.log(mapOrNetwork)
        if (mapOrNetwork === 'map') {
            cyMap = cy.mapboxgl({
                accessToken: 'pk.eyJ1IjoidG9kb3J0b2RvciIsImEiOiJja3pyNjY3aXcwN2N4MnJ0OWV0dTJ6eHliIn0.SczAOEiQ1VlazE-oYGOFLQ', // cytoscape-mapbox-gl token
                style: 'mapbox://styles/mapbox/streets-v11'
            },
                {
                    getPosition: (node) => {
                        return [node.data('lng'), node.data('lat')];
                    },
                    setPosition: (node, lngLat) => {
                        node.data('lng', lngLat.lng);
                        node.data('lat', lngLat.lat);
                        console.log(node.id(), lngLat);
                    },
                    animate: true,
                    animationDuration: 1,
                });
            cyMap.map.addControl(new mapboxgl.NavigationControl(), 'top-left');

        } else if (mapOrNetwork === 'network') {
            cyMap.destroy();
            cy.style().fromJson(initial_style).update()
            const changeSelected = () => {
                const $select = document.querySelector('#Flow');
                $select.value = 'TF'
            };
            changeSelected();
            newLayout.run();
            cy.fit();
        }
    }
    document.getElementById('mapOrNetwork').addEventListener('change', switchMapOrNetwork);

    const changeStateFlowStyle = () => {
        const State = document.getElementById('State').value;
        const Flow = document.getElementById('Flow').value;
        cy.style().fromJson([
            {
                selector: 'node',
                style: {
                    'border-color': '#ffffff',
                    'border-width': 2,
                    'background-color': "mapData(" + State + Flow + "HatColor, 0, 1, red, green)",
                    'color': 'white',
                    'label': 'data(id)',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'text-background-opacity': 0,
                    'text-background-padding': 4,
                    // "width": "mapData(" + State + Flow + "ValueSize, 0, 1, 80, 200)",
                    "width": "mapData(Baseline" + Flow + "ValueSize, 0, 1, 80, 200)",
                    // "height": "mapData(" + State + Flow + "ValueSize, 0, 1, 80, 200)",
                    "height": "mapData(Baseline" + Flow + "ValueSize, 0, 1, 80, 200)",
                    'opacity': 1,
                    // 'font-size': "mapData(" + State + Flow + "ValueSize, 0, 1, 40, 50)",
                    'font-size': "mapData(Baseline" + Flow + "ValueSize, 0, 1, 40, 50)",
                    'overlay-opacity': 0,
                }
            },
            {
                selector: 'node:selected',
                style: {
                    'border-color': '#ff0000',
                    'border-width': 6,
                    'border-opacity': 0.5
                }
            },
            {
                selector: 'edge',
                style: {
                    'line-color': "mapData(" + State + Flow + "HatColor, 0, 1, red, green)",
                    // 'width': "mapData(" + State + Flow + "ValueSize, 0, 1, 0, 20)",
                    'width': "mapData(Baseline" + Flow + "ValueSize, 0, 1, 0, 20)",
                    'curve-style': 'unbundled-bezier',
                    // 'opacity': "mapData(" + State + Flow + "ValueSize, 0, 1, 0.5, 1)",
                    'opacity': 1,
                    'target-arrow-shape': 'triangle-backcurve',
                    'source-arrow-shape': 'circle',
                    'target-arrow-color': "mapData(" + State + Flow + "HatColor, 0, 1, red, green)",
                    'source-arrow-color': "mapData(" + State + Flow + "HatColor, 0, 1, red, green)",
                    'overlay-opacity': 0,
                }
            },
        ]).update();
    }
    document.getElementById('State').addEventListener('change', changeStateFlowStyle);
    document.getElementById('Flow').addEventListener('change', changeStateFlowStyle);

    const resetView = () => {
        let stateMapNetwork = document.getElementById('mapOrNetwork').value
          if (stateMapNetwork === 'network') {
            cy.fit();
          } else {
            cyMap.fit(undefined, { padding: 50 });
          }
        };
    document.getElementById('resetview').addEventListener('click', resetView);

    const exportImage = () => {
        const b64toBlob = (b64Data, contentType='', sliceSize=512) => {
            const byteCharacters = atob(b64Data);
            const byteArrays = [];
          
            for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
              const slice = byteCharacters.slice(offset, offset + sliceSize);
          
              const byteNumbers = new Array(slice.length);
              for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
              }
          
              const byteArray = new Uint8Array(byteNumbers);
              byteArrays.push(byteArray);
            }
          
            const blob = new Blob(byteArrays, {type: contentType});
            return blob;
          }
        let stateMapNetwork = document.getElementById('mapOrNetwork').value
        let Flow = document.getElementById('Flow').value
        let State = document.getElementById('State').value
        var b64key = 'base64,';
        var b64 = cy.png({bg: true}).substring( cy.png().indexOf(b64key) + b64key.length );
        var imgBlob = b64toBlob( b64, 'image/png' );
        
        saveAs( imgBlob, `${stateMapNetwork}_${State}_${Flow}.png` );
        // var png64 = cy.png();

        // // put the png data in an img tag
        // document.querySelector('#png-eg').setAttribute('src', png64);
    }
    document.getElementById('exportimage').addEventListener('click', exportImage);
})


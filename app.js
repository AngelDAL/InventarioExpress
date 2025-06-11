document.getElementById('lector').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        const codigo = this.value;
        this.value = '';
        procesarCodigo(codigo);
    }
});
document.getElementById("BTNBuscar").addEventListener('click', function () {
    procesarCodigo(document.getElementById("lector").value, true)
})
document.getElementById('lector').addEventListener("focusin", () => { controller.activated = false; })
document.getElementById('lector').addEventListener("focusout", () => {
    //wait 1 second to activate the controller again to avoid the enter keypress event to be triggered again
    setTimeout(() => { controller.activated = true; }, 1000)
})

document.getElementById("registrar").addEventListener('click', function () {
    registrar();
})

//when document is ready
document.addEventListener('DOMContentLoaded', function () {
    getInventary();
});

document.getElementById("RegisterCode").addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        document.getElementById("RegisterNombre").focus();
    }
});

document.getElementById("RegisterImagen").addEventListener("change", (e) => {
    document.getElementById("Preview").style.display = "";
    const [file] = document.getElementById("RegisterImagen").files
    if (file) {
        // Mostrar solo el preview local
        document.getElementById('PreviewImg').style.display = '';
        document.getElementById('imageCarousel').style.display = 'none';
        PreviewImg.src = URL.createObjectURL(file)
    }
})
document.getElementById("BackToInit").addEventListener("click", () => {
    //focus the lector input
    document.getElementById("lector").focus();
    showMenu("Inventario")
    getInventary();
});


//if the user touch the div Divregistro, (if is in movile, use touch, in both cases really), the controller will be not activated, else, yes
// document.addEventListener('click', function (e) {
//     //get a list of elements in the x and y of the pointer
//     const elements = document.elementsFromPoint(e.clientX, e.clientY);
//     for (let i = 0; elements.length > i; i++) {
//         if (elements[i].id == "Divregistro" || elements[i].id == "Inventary") {
//             controller.activated = false
//             return
//         }
//     }
//     controller.activated = true
// })

document.getElementById("closeAddRegister").addEventListener("click", () => {
    document.getElementById("Divregistro").style.display = "none"
    resetRegistro();
})
document.getElementById("BTNRest").addEventListener("click", () => { ChangeQuantity("REST") })
document.getElementById("BTNAdd").addEventListener("click", () => { ChangeQuantity("ADD") })

document.getElementById("LBLCantidad").addEventListener("focus", () => {
    window.getSelection().selectAllChildren(document.getElementById("LBLCantidad"));
})
document.getElementById("LBLCantidad").addEventListener("input", () => {
    if (document.getElementById("LBLCantidad").innerText == "") {
        document.getElementById("LBLCantidad").innerText = "0";
    }
    ChangeQuantity("ADD", document.getElementById("LBLCantidad").innerText)
})

let ScannerActive = false;
document.getElementById("BTNBarcode").addEventListener("click", () => {
    if (ScannerActive) {
        Quagga.stop();
        document.getElementById("CameraScanner").style.display = "none";
        document.getElementById("BTNBarcode").innerHTML = '<i class="fa-solid fa-barcode"></i> ';
        ScannerActive = false;
        return;
    } else {
        document.getElementById("CameraScanner").style.display = "block";
        document.getElementById("BTNBarcode").innerHTML = '<i class="fa-solid fa-stop"></i> ';
        ScannerActive = true;
    }
    Quagga.init(
        {
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: document.querySelector("#CameraScanner")
            },
            decoder: {
                readers: ["ean_reader"]
            }
        },
        function (err) {
            if (err) {
                console.log(err);
                return;
            }
            console.log("Initialization finished. Ready to start");
            Quagga.start();
        }
    );

    Quagga.onDetected(function (result) {
        var code = result.codeResult.code;
        console.log(code);
        document.getElementById("resultado").innerHTML = result.codeResult.code;
        procesarCodigo(code, true);
        Quagga.stop();
        document.getElementById("CameraScanner").style.display = "none";
        document.getElementById("BTNBarcode").innerHTML = '<i class="fa-solid fa-barcode"></i> ';
        ScannerActive = false;

    });

})

document.getElementById("InventarioRadio").addEventListener("click", () => {
    $(".MainView").hide();
    $("#InventarioContainer").show();
    controller.activated = true;
})

document.getElementById("PVRadio").addEventListener("click", () => {
    $(".MainView").hide();
    $("#PuntoDeVentaContainer").show();
    controller.activated = false;
    historialVentas();
})


document.getElementById("TXTPName").addEventListener("change", () => { UpdateName(document.getElementById("TXTPName").value) })
document.getElementById("TXTUptCosto").addEventListener("change", () => { UpdateCosto(document.getElementById("TXTUptCosto").value) })
document.getElementById("TXTUptPrecio").addEventListener("change", () => { UpdatePrecio(document.getElementById("TXTUptPrecio").value) })

const controller = {
    tempComand: "",
    activated: true,
    lastItem: "",
    resetTimer: null
};

document.addEventListener('keypress', function (e) {
    // Limpiar el temporizador anterior si existe
    if (controller.resetTimer) {
        clearTimeout(controller.resetTimer);
    }

    if (e.key == "Backspace" && controller.activated) {
        controller.tempComand = controller.tempComand.slice(0, -1);
    }
    if (e.key == "Enter" && controller.activated) {
        let command = getCommand();
        switch (command[1]) {
            case "NEW":
                registerProduct();
                break;
            case "ADD":
                ChangeQuantity("ADD")
                break;
            case "REST":
                ChangeQuantity("REST")
                break;
            default:
                procesarCodigo(controller.tempComand)
        }
        controller.tempComand = "";
    } else {
        if (controller.activated) {
            controller.tempComand += e.key;
            // Configurar nuevo temporizador
            controller.resetTimer = setTimeout(() => {
                controller.tempComand = "";
            }, 1000);
        }
    }
});

async function procesarCodigo(codigo = "", SearchWithApi = false) {
    if (codigo == "") return;
    let Content = new FormData();
    Content.append("codigo", codigo)
    let consult = await fetch('php/process.php', { method: 'POST', body: Content })
    let data = await consult.text();
    data = JSON.parse(data);
    let resultado = document.getElementById('resultado');
    if (data.NotFound) {
        // resultado.innerHTML = `<div style="text-warning">${data.error}</div>`;
        Notificacion(data.response)
        registerProduct(codigo)
        if (!SearchWithApi) return;
        document.getElementById("SearchingStatus").innerHTML = '<i class="fa-solid fa-spinner fa-spin-pulse"></i>' + " Buscando producto en la base de datos..."
        let name = await SearchBarcode(codigo)
        if (name.status == "unable") {
            procesarCodigo(codigo, true);
            return;
        }
        if (name.product.title != undefined && name.product.images && name.product.images.length > 0) {
            document.getElementById("RegisterNombre").value = name.product.title;
            document.getElementById("Preview").style.display = "";
            // Mostrar el carrusel y poblarlo
            const carouselInner = document.getElementById('carouselInner');
            const imageCarousel = document.getElementById('imageCarousel');
            carouselInner.innerHTML = '';
            name.product.images.forEach((imageUrl, index) => {
                const carouselItem = document.createElement('div');
                carouselItem.classList.add('carousel-item');
                if (index === 0) carouselItem.classList.add('active');
                const img = document.createElement('img');
                img.classList.add('d-block', 'w-100');
                img.src = imageUrl;
                img.alt = 'Imagen ' + (index + 1);
                carouselItem.appendChild(img);
                carouselInner.appendChild(carouselItem);
            });
            imageCarousel.style.display = '';
            // Inicializar/reinicializar el carrusel de Bootstrap sin auto-slide
            let carouselInstance;
            if (window.bootstrap && window.bootstrap.Carousel) {
                try {
                    carouselInstance = bootstrap.Carousel.getInstance(imageCarousel);
                    if (carouselInstance) {
                        carouselInstance.dispose();
                    }
                    carouselInstance = new bootstrap.Carousel(imageCarousel, { interval: false, ride: false });
                } catch (e) { }
            }
            // Asignar la imagen activa a PreviewImg al iniciar
            setTimeout(() => {
                const activeImg = carouselInner.querySelector('.carousel-item.active img');
                if (activeImg) {
                    document.getElementById('PreviewImg').src = activeImg.src;
                }
            }, 100);
            // Actualizar PreviewImg cada vez que cambie la diapositiva
            imageCarousel.addEventListener('slid.bs.carousel', function () {
                const activeImg = carouselInner.querySelector('.carousel-item.active img');
                if (activeImg) {
                    document.getElementById('PreviewImg').src = activeImg.src;
                }
            });
        } else {
            // Si no hay imágenes de la API, ocultar el carrusel
            document.getElementById('imageCarousel').style.display = 'none';
        }
        document.getElementById("SearchingStatus").innerHTML = ''
    } else {
        //     resultado.innerHTML = `
        //     <div style="color: green;">
        //         Producto: ${data.response.nombre}<br>
        //         Cantidad actual: ${data.response.cantidad}
        //     </div>
        // `;
        controller.lastItem = codigo
        showMenu("ProductRender")
        renderProduct(data.response)

    }
    setTimeout(() => resultado.innerHTML = '', 3000);
}

async function SearchBarcode(codigo) {
    let Content = new FormData();
    Content.append("barcode", codigo)
    let consult = await fetch('php/searchBarcode.php', { method: 'POST', body: Content })
    let data = await consult.text();
    data = JSON.parse(data);
    return data;
}

async function registrar() {
    let content = new FormData();
    content.append("Nombre", document.getElementById("RegisterNombre").value)
    content.append("Code", document.getElementById("RegisterCode").value)
    content.append("Costo", document.getElementById("TXTCosto").value)
    content.append("Precio", document.getElementById("TXTPrecio").value)
    content.append("imagen", document.getElementById("PreviewImg").src)
    content.append("file", document.getElementById("RegisterImagen").files[0])
    let response = await fetch('php/registrar.php', { method: 'POST', body: content });
    let result = await response.text();
    Notificacion(JSON.parse(result).response)
    resetRegistro();
    getInventary();
}

function resetRegistro() {
    document.getElementById("Divregistro").style.display = "none";
    document.getElementById("RegisterCode").value = "";
    document.getElementById("RegisterNombre").value = "";
    document.getElementById("RegisterImagen").value = "";
    document.getElementById("Preview").style.display = "none";
    // Limpiar carrusel y preview
    const carouselInner = document.getElementById('carouselInner');
    if (carouselInner) carouselInner.innerHTML = '';
    document.getElementById('imageCarousel').style.display = 'none';
    document.getElementById('PreviewImg').src = '';
    document.getElementById('PreviewImg').style.display = 'none';
    showMenu("Inventario");
}

function renderProduct(data) {
    document.getElementById("ProductName").innerHTML = data.nombre
    document.getElementById("ProductCode").value = data.codigo_barras
    document.getElementById("ProductCodeLBL").innerText = data.codigo_barras
    document.getElementById("TXTPName").value = data.nombre
    document.getElementById("TXTPDate").value = data.fecha_actualizacion
    document.getElementById("TXTUptCosto").value = data.costo
    document.getElementById("TXTUptPrecio").value = data.precio
    document.getElementById("LBLCantidad").innerHTML = data.cantidad
    if (data.url_image == "") {
        document.getElementById("NoImage").style.display = ""
        document.getElementById("PIPreview").style.display = "none"
    } else {
        document.getElementById("NoImage").style.display = "none"
        document.getElementById("PIPreview").style.display = ""
        document.getElementById("ImagePreviewProduct").src = data.url_image
    }
}

async function UpdateCosto(newCost) {
    const Content = new FormData();
    Content.append("code", controller.lastItem)
    Content.append("newCost", newCost)
    let response = await fetch('php/updateCost.php', { method: 'POST', body: Content });
    let result = await response.text();
    Notificacion(JSON.parse(result).response)
}

async function UpdatePrecio(newCost) {
    const Content = new FormData();
    Content.append("code", controller.lastItem)
    Content.append("newCost", newCost)
    let response = await fetch('php/updatePrecio.php', { method: 'POST', body: Content });
    let result = await response.text();
    Notificacion(JSON.parse(result).response)
}

async function UpdateName(newName) {
    const Content = new FormData();
    Content.append("code", controller.lastItem)
    Content.append("newName", newName)
    let response = await fetch('php/updateName.php', { method: 'POST', body: Content });
    let result = await response.text();
    console.log(result)
    Notificacion(JSON.parse(result).response)
}

async function getInventary() {
    let consult = await fetch('php/inventary.php', { method: 'POST' });
    let data = await consult.json();
    RenderInventary(data, "TableContainer")
}

function showMenu(menu) {
    $(".Frame").hide();
    $("#" + menu).show();
}


function RenderInventary(data, container) {
    document.getElementById(container).innerHTML = "";
    let Table = document.createElement("table");
    Table.classList.add("table");
    Table.classList.add("table-striped");
    Table.classList.add("table-hover");
    let thead = document.createElement("thead");
    let tr = document.createElement("tr");
    let th = document.createElement("th");
    th.innerHTML = "#";
    tr.appendChild(th);
    th = document.createElement("th");
    th.innerHTML = "Imagen";
    tr.appendChild(th);
    th = document.createElement("th");
    th.innerHTML = "Nombre";
    tr.appendChild(th);
    th = document.createElement("th");
    th.innerHTML = "Codigo";
    tr.appendChild(th);
    th = document.createElement("th");
    th.innerHTML = "Cantidad";
    tr.appendChild(th);
    th = document.createElement("th");
    th.innerHTML = "Fecha de actualización";
    tr.appendChild(th);
    thead.appendChild(tr);
    let tbody = document.createElement("tbody");
    for (let i = 0; data.length > i; i++) {
        let tr = document.createElement("tr");
        tr.addEventListener("click", () => {
            controller.lastItem = data[i].codigo_barras
            showMenu("ProductRender")
            renderProduct(data[i])
        });
        let td = document.createElement("td");
        td.innerHTML = i + 1;
        tr.appendChild(td);
        td = document.createElement("td");
        td.classList.add("text-center")
        if (data[i].url_image != "") {
            let img = document.createElement("img");
            img.src = data[i].url_image;
            img.style.width = "50px";
            img.style.height = "50px";
            img.style.borderRadius = "8px";
            img.style.objectFit = "cover";
            td.appendChild(img);
        } else {
            let span = document.createElement("span");
            span.classList.add("text-center")
            span.innerHTML = ' <i class="fa-solid fa-basket-shopping"></i>';
            span.style.fontSize = "30px";
            span.style.color = "gray";
            td.appendChild(span);
        }
        tr.appendChild(td);
        td = document.createElement("td");
        td.innerHTML = data[i].nombre;
        tr.appendChild(td);
        td = document.createElement("td");
        td.innerHTML = data[i].codigo_barras;
        tr.appendChild(td);
        td = document.createElement("td");
        td.innerHTML = data[i].cantidad;
        tr.appendChild(td);
        td = document.createElement("td");
        td.innerHTML = data[i].fecha_actualizacion;
        tr.appendChild(td);
        tbody.appendChild(tr);
    }
    Table.appendChild(thead);
    Table.appendChild(tbody);
    document.getElementById(container).appendChild(Table);
    //data table in spanish
    $(Table).DataTable({
        language: {
            "decimal": "",
            "emptyTable": "No hay datos disponibles",
            "info": "Mostrando _START_ a _END_ de _TOTAL_ registros",
            "infoEmpty": "Mostrando 0 a 0 de 0 registros",
            "infoFiltered": "(filtrado de _MAX_ registros totales)",
            "infoPostFix": "",
            "thousands": ",",
            "lengthMenu": "Mostrar _MENU_ registros",
            "loadingRecords": "Cargando...",
            "processing": "Procesando...",
            "search": "Buscar:",
            "zeroRecords": "No se encontraron resultados",
            "paginate": {
                "first": "Primero",
                "last": "Último",
                "next": "Siguiente",
                "previous": "Anterior"
            }
        },
        bootstrap5: true,
        responsive: true
    });

}

function registerProduct(code = "") {
    document.getElementById("Divregistro").style.display = "block";
    showMenu("RegisterProduct")
    if (code != "") {
        document.getElementById("RegisterCode").value = code;
        document.getElementById("RegisterNombre").focus();
    } else {
        document.getElementById("RegisterCode").focus();
    }
}
function Notificacion(Content, time = 3) {
    document.getElementById("Alerta").innerHTML = Content
    document.getElementById("Alerta").classList.remove("hide");
    setTimeout(() =>
        document.getElementById("Alerta").classList.add("hide")
        , time * 1000);
}

async function ChangeQuantity(AddOrRest, set = 0) {
    let Content = new FormData();
    Content.append("code", controller.lastItem)
    Content.append("AddOrRest", AddOrRest)
    if (set != 0) {
        Content.append("set", set)
    }
    let Consult = await fetch("php/ChangeQuantity.php", { method: "POST", body: Content })
    let data = await Consult.text();
    data = JSON.parse(data);
    Notificacion(data.response)
    procesarCodigo(controller.lastItem)
}

function getCommand() {
    let data = (controller.tempComand).split("COMMAND");
    return data;
}

document.getElementById("dineroRecibido").addEventListener('input', calcularCambio);
document.getElementById("dineroRecibido").addEventListener("focusin", () => { controller.activated = false; })
document.getElementById("dineroRecibido").addEventListener("focusout", () => { controller.activated = true; })

function calcularCambio() {
    const totalVenta = document.getElementById('totalVenta');
    const dineroRecibido = document.getElementById('dineroRecibido');
    const cambioVenta = document.getElementById('cambioVenta');

    const total = parseFloat(totalVenta.textContent.replace('$', ''));
    const recibido = parseFloat(dineroRecibido.value) || 0;
    const cambio = recibido - total;
    cambioVenta.textContent = `$${Math.max(0, cambio).toFixed(2)}`;
}

function actualizarTotal() {
    const total = productosList.reduce((sum, prod) => sum + (prod.precio * prod.cantidad), 0);
    totalVenta.textContent = `$${total.toFixed(2)}`;
    calcularCambio();
}


let timeoutBusqueda;
const sugerenciasContainer = document.getElementById('sugerenciasProductos');
const SugestList = [];
let firstResultAccept = false;

document.getElementById("codigoVenta").addEventListener('input', function (e) {
    clearTimeout(timeoutBusqueda);
    const busqueda = this.value;

    //if the user press enter, we need to add the first sugestion to the list of products

    if (busqueda.length > 0) {
        timeoutBusqueda = setTimeout(() => buscarProductos(busqueda), 300);
    } else {
        sugerenciasContainer.style.display = 'none';
    }
});


function AddIt(index = 0) {
    const producto = SugestList[index];
    const existingProduct = productosList.find(p => p.codigo_barras === producto.codigo_barras);

    if (existingProduct) {
        existingProduct.cantidad += 1;
    }
    else {
        productosList.push({ ...producto, cantidad: 1 });
    }
    //set the image in imagenProductoVenta and show it
    document.getElementById('imagenProductoVenta').src = producto.url_image || 'resorces/placeholder_emptyCar.png';
    document.getElementById('imagenProductoVenta').style.display = 'block';
    //set the name in nombreProductoVenta and show it
    document.getElementById('nombreProductoVenta').innerHTML = producto.nombre;
    document.getElementById('nombreProductoVenta').style.display = 'block';
    document.getElementById("sugerenciasProductos").style.display = 'none';
    renderListaProductos(productosList);
    firstResultAccept = false;
    document.getElementById("codigoVenta").value = "";
    SugestList.length = 0;
}

document.getElementById("codigoVenta").addEventListener('keypress', function (e) {
    firstResultAccept = false;
    if (e.key === 'Enter') {
        //add the first sugestion to the list of products
        firstResultAccept = true;
        if (SugestList.length > 0) {
            AddIt();
        }

    }
})

document.getElementById("codigoVenta").addEventListener("focusin", () => { controller.activated = false })
document.getElementById("codigoVenta").addEventListener("focusout", () => { controller.activated = true })

async function buscarProductos(busqueda) {
    const formData = new FormData();
    formData.append('codigo', busqueda);
    const response = await fetch('php/search.php', { method: 'POST', body: formData });
    const productos = await response.json();
    SugestList.length = 0;
    if (!productos.Found || productos.response.length === 0) {
        sugerenciasContainer.style.display = 'none';
        return;
    }
    if (firstResultAccept && productos.Found) {
        SugestList.push(productos.response[0]);
        AddIt();
        firstResultAccept = false;
        return;
    }
    mostrarSugerencias(productos.response);
}

function mostrarSugerencias(productos) {
    if (productos.length === 0) {
        sugerenciasContainer.style.display = 'none';
        return;
    }
    sugerenciasContainer.innerHTML = '';
    for (let i = 0; i < productos.length; i++) {
        const div = document.createElement('div');
        div.className = 'sugerencia-item';
        div.innerHTML = `
            <img src="${productos[i].url_image || 'resorces/placeholder_emptyCar.png'}" alt="${productos[i].nombre}">
            <div class="producto-info">
                <div class="producto-nombre">${productos[i].nombre}</div>
                <div class="producto-codigo">${productos[i].codigo_barras}</div>
            </div>
        `;
        SugestList.push(productos[i]);

        div.addEventListener('click', () => {
            sugerenciasContainer.style.display = 'none';
            AddIt(i);
        });
        sugerenciasContainer.appendChild(div);
    };

    sugerenciasContainer.style.display = 'block';
}

// Cerrar sugerencias al hacer clic fuera
document.addEventListener('click', function (e) {
    if (!document.getElementById("codigoVenta").contains(e.target) && !sugerenciasContainer.contains(e.target)) {
        sugerenciasContainer.style.display = 'none';
    }
});


const productosList = [];

function renderListaProductos(products) {
    //listaProductos is the body of the table 
    const listaProductos = document.getElementById('listaProductos');
    listaProductos.innerHTML = '';
    products.forEach((producto, index) => {
        let Precio = Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(producto.precio);
        let Subtotal = Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(producto.precio * producto.cantidad);
        const tr = document.createElement('tr');

        //in Cantidad add controllers to add and rest the quantity of the product
        /*
        <th>Imagen</th>
           <th>Producto</th>
                                            <th>Cantidad</th>
                                            <th>Precio</th>
                                            <th>Subtotal</th>
                                            <th>Acciones</th>
        */
        tr.innerHTML = `
            <td><img src="${producto.url_image || 'resorces/placeholder_emptyCar.png'}" alt="${producto.nombre}" width="50"></td>
            <td>${producto.nombre}</td>
            <td>
                <div class="input-group input-group-sm" style="width: 120px;">
                    <button class="btn btn-outline-secondary" type="button" onclick="cambiarCantidad(${index}, -1)">-</button>
                    <input type="number" class="form-control text-center" value="${producto.cantidad}" 
                           onchange="actualizarCantidad(${index}, this.value)" min="1">
                    <button class="btn btn-outline-secondary" type="button" onclick="cambiarCantidad(${index}, 1)">+</button>
                </div>
            </td>
            <td>${Precio}</td>
            <td>${Subtotal}</td>
            <td><button class="btn btn-outline-dark btn-sm" onclick="eliminarProducto(${index})">Eliminar</button></td>
        `;
        listaProductos.appendChild(tr);

    });
    actualizarTotal();


}

document.getElementById("btnCancelarVenta").addEventListener('click', cancelarVenta);
document.getElementById("btnTerminarVenta").addEventListener('click', terminarVenta);

async function terminarVenta() {
    const totalVenta = document.getElementById('totalVenta');
    const dineroRecibido = document.getElementById('dineroRecibido');
    const total = parseFloat(totalVenta.textContent.replace('$', ''));
    const recibido = parseFloat(dineroRecibido.value) || 0;
    const cambio = recibido - total;

    if (cambio < 0) {
        Notificacion('El dinero recibido no es suficiente para cubrir el total de la venta');
        return;
    }

    const formData = new FormData();
    formData.append('total', total);
    formData.append('recibido', recibido);
    formData.append('cambio', cambio);
    formData.append('productos', JSON.stringify(productosList));


    const response = await fetch('php/venta.php', { method: 'POST', body: formData });
    let data = await response.text();
    data = JSON.parse(data);

    Notificacion(data.response);
    productosList.length = 0;
    renderListaProductos(productosList);
    document.getElementById('dineroRecibido').value = '';
    document.getElementById('cambioVenta').textContent = '$0.00';
    document.getElementById('imagenProductoVenta').style.display = 'none';
    document.getElementById('nombreProductoVenta').style.display = 'none';
}
function cancelarVenta() {
    productosList.length = 0;
    renderListaProductos(productosList);
    document.getElementById('dineroRecibido').value = '';
    document.getElementById('cambioVenta').textContent = '$0.00';
    document.getElementById('imagenProductoVenta').style.display = 'none';
    document.getElementById('nombreProductoVenta').style.display = 'none';
}

function eliminarProducto(index) {
    productosList.splice(index, 1);
    renderListaProductos(productosList);
}

function cambiarCantidad(index, cantidad) {
    productosList[index].cantidad += cantidad;
    if (productosList[index].cantidad < 1) {
        productosList[index].cantidad = 1;
    }
    renderListaProductos(productosList);

}

async function historialVentas() {
    let consult = await fetch('php/historial.php', { method: 'GET' });
    let data = await consult.json();
    renderHistorial(data);
}
function renderHistorial(ventas) {
    const container = document.getElementById('historialContainer');
    container.innerHTML = '';

    const table = document.createElement('table');
    table.classList.add('table', 'table-striped', 'table-hover');

    table.innerHTML = `
        <thead>
            <tr>
                <th>#</th>
                <th>Fecha</th>
                <th>Total</th>
                <th>Recibido</th>
                <th>Cambio</th>
                <th>Detalles</th>
            </tr>
        </thead>
        <tbody>
            ${ventas.map((venta, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${venta.fecha}</td>
                    <td>${formatCurrency(venta.total)}</td>
                    <td>${formatCurrency(venta.recibido)}</td>
                    <td>${formatCurrency(venta.cambio)}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" 
                                data-bs-toggle="modal" 
                                data-bs-target="#detalleVenta${venta.id}"
                                title="Click para ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>
            `).join('')}
        </tbody>
    `;

    container.appendChild(table);

    // Crear modals para cada venta
    ventas.forEach(venta => {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = `detalleVenta${venta.id}`;
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Detalles de Venta #${venta.id}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th>Cantidad</th>
                                        <th>Precio</th>
                                        <th>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${venta.productos.map(producto => `
                                        <tr>
                                            <td>
                                                <img src="${producto.url_image || 'resorces/placeholder_emptyCar.png'}" 
                                                     alt="${producto.nombre}" 
                                                     width="30" 
                                                     class="me-2 rounded">
                                                ${producto.nombre}
                                            </td>
                                            <td>${producto.cantidad}</td>
                                            <td>${formatCurrency(producto.precio)}</td>
                                            <td>${formatCurrency(producto.precio * producto.cantidad)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                                <tfoot>
                                    <tr class="table-info">
                                        <td colspan="3" class="text-end"><strong>Total:</strong></td>
                                        <td><strong>${formatCurrency(venta.total)}</strong></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(modal);
    });

    // Inicializar DataTable
    $(table).DataTable({
        language: {
            "decimal": "",
            "emptyTable": "No hay ventas registradas",
            "info": "Mostrando _START_ a _END_ de _TOTAL_ ventas",
            "infoEmpty": "Mostrando 0 a 0 de 0 ventas",
            "infoFiltered": "(filtrado de _MAX_ ventas totales)",
            "infoPostFix": "",
            "thousands": ",",
            "lengthMenu": "Mostrar _MENU_ ventas",
            "loadingRecords": "Cargando...",
            "processing": "Procesando...",
            "search": "Buscar:",
            "zeroRecords": "No se encontraron resultados",
            "paginate": {
                "first": "Primero",
                "last": "Último",
                "next": "Siguiente",
                "previous": "Anterior"
            }
        },
        order: [[1, 'desc']], // Ordenar por fecha descendente
        responsive: true
    });

    // Inicializar tooltips de Bootstrap
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

function formatCurrency(amount) {
    return Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(amount);
}
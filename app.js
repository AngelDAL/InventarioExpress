document.getElementById('lector').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        const codigo = this.value;
        this.value = '';
        procesarCodigo(codigo);
    }
});


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
        PreviewImg.src = URL.createObjectURL(file)
    }
})
document.getElementById("BackToInit").addEventListener("click", () => {
    showMenu("Inventario")
    getInventary();
});

//if the user touch the div Divregistro, (if is in movile, use touch, in both cases really), the controller will be not activated, else, yes
document.addEventListener('click', function (e) {
    //get a list of elements in the x and y of the pointer
    const elements = document.elementsFromPoint(e.clientX, e.clientY);
    for (let i = 0; elements.length > i; i++) {
        if (elements[i].id == "Divregistro" || elements[i].id == "Inventary") {
            controller.activated = false
            return
        }
    }
    controller.activated = true
})

document.getElementById("closeAddRegister").addEventListener("click", () => {
    document.getElementById("Divregistro").style.display = "none"
    resetRegistro();
})
document.getElementById("BTNRest").addEventListener("click", () => { ChangeQuantity("REST") })
document.getElementById("BTNAdd").addEventListener("click", () => { ChangeQuantity("ADD") })

const controller = {
    tempComand: "",
    activated: true,
    lastItem: "",
};
document.addEventListener('keypress', function (e) {

    if (e.key == "Backspace" && controller.activated) {
        controller.tempComand = controller.tempComand.slice(0, -1);
    }
    if (e.key == "Enter" && controller.activated) {
        console.log(controller.tempComand)
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
        }
    }
});


async function procesarCodigo(codigo = "") {
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
        document.getElementById("SearchingStatus").innerHTML = '<i class="fa-solid fa-spinner fa-spin-pulse"></i>' + " Buscando producto en la base de datos..."
        let name = await SearchBarcode(codigo)
        if (name.product.title != undefined) {
            document.getElementById("RegisterNombre").value = name.product.title
            document.getElementById("Preview").style.display = "";
            document.getElementById("PreviewImg").src = name.product.images[0]
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
    console.log(data)
    return data;
}

async function registrar() {
    let content = new FormData();
    content.append("Nombre", document.getElementById("RegisterNombre").value)
    content.append("Code", document.getElementById("RegisterCode").value)
    content.append("imagen", document.getElementById("PreviewImg").src)
    content.append("file", document.getElementById("RegisterImagen").files[0])
    let response = await fetch('php/registrar.php', { method: 'POST', body: content });
    let result = await response.text();
    console.log(result)
    Notificacion(JSON.parse(result).response)
    resetRegistro();
    getInventary();
}

function resetRegistro() {
    document.getElementById("Divregistro").style.display = "none";
    document.getElementById("RegisterCode").value = "";
    document.getElementById("RegisterNombre").value = "";
    document.getElementById("RegisterImagen").value = "";
    document.getElementById("Preview").style.display = "none"
    document.getElementById("PreviewImg").src = "";
    showMenu("Inventario");
}

function renderProduct(data) {
    console.log(data)
    document.getElementById("ProductName").innerHTML = data.nombre
    document.getElementById("ProductCode").value = data.codigo_barras
    document.getElementById("TXTPName").value = data.nombre
    document.getElementById("TXTPDate").value = data.fecha_actualizacion
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

async function ChangeQuantity(AddOrRest) {
    let Content = new FormData();
    Content.append("code", controller.lastItem)
    Content.append("AddOrRest", AddOrRest)
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


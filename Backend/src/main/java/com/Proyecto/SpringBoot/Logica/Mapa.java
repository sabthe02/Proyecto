package com.Proyecto.SpringBoot.Logica;

public class Mapa {
    private int[][] contenido;

    public Mapa()
    {
        contenido = new int[600][600];

        for(int i = 0; i<600; i++)
        {
            for(int j = 0; j<600; j++)
            {
                contenido[i][j] = 0;
            }
        }
    }

    public Mapa(int[][] contenido)
    {
        this.contenido = contenido;
    }

    public int[][] getContenido() {
        return contenido;
    }

    public void setContenido(int[][] contenido) {
        this.contenido = contenido;
    }

    public int getContenido(int i, int j) {
        return contenido[i][j];
    }

    public void setContenido(int i, int j, int valor) {
        contenido[i][j] = valor;
    }
}

package com.Proyecto.SpringBoot.Logica.DTO;

public class JugadorDTO {

    String nickName;
    String id;
    String team;

    public JugadorDTO(String id, String nickName)
    {
        this.nickName = nickName;
        this.id = id;
        this.team = null;
    }

    public JugadorDTO(String id, String nickName, String team)
    {
        this.nickName = nickName;
        this.id = id;
        this.team = team;
    }

    public String getNickName() {
        return nickName;
    }

    public void setNickName(String nickName) {
        this.nickName = nickName;
    }

    public void setId(String id)
    {
        this.id = id;
    }

    public String getId()
    {
        return id;
    }

    public String getTeam() {
        return team;
    }

    public void setTeam(String team) {
        this.team = team;
    }

}

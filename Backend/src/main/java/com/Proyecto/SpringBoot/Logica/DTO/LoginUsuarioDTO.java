package com.Proyecto.SpringBoot.Logica.DTO;

public class LoginUsuarioDTO {

    private String id;
    private String nickname;
    private String team;
    private boolean partidaGuardada;

    public LoginUsuarioDTO() {
    }

    public LoginUsuarioDTO(String id, String nickName, String team, boolean partidaGuardada) {
        this.id = id;
        this.nickname = nickName;
        this.team = team;
        this.partidaGuardada = partidaGuardada;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getNickName() {
        return nickname;
    }

    public void setNickName(String nickName) {
        this.nickname = nickName;
    }

    public String getTeam() {
        return team;
    }

    public void setTeam(String team) {
        this.team = team;
    }

    public boolean isPartidaGuardada() {
        return partidaGuardada;
    }

    public void setPartidaGuardada(boolean partidaGuardada) {
        this.partidaGuardada = partidaGuardada;
    }

}
